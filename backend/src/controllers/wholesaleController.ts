import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { WHOLESALE_STATUSES, sanitizeText, validateEnquiryInput } from '../utils/wholesaleValidation';
import { notifyWholesaleEnquirySubmitted, retryWholesaleNotification } from '../services/adminNotifications';

// ---------------------------------------------------------------------------
// Lightweight in-memory abuse protection (per instance; DB dedupe is the backstop)
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_PER_IP = 8;
const ipHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const first = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX_PER_IP) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) ipHits.delete(k);
  }
  return false;
}

// ---------------------------------------------------------------------------
// PUBLIC: submit an enquiry
// ---------------------------------------------------------------------------
export async function createWholesaleEnquiry(req: Request, res: Response): Promise<void> {
  try {
    // Honeypot: bots fill hidden fields. Pretend success, store nothing.
    if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
      res.status(201).json({ message: 'Thank you! Your enquiry has been received.' });
      return;
    }

    if (rateLimited(clientIp(req))) {
      res.status(429).json({ error: 'Too many enquiries from this connection. Please try again later.' });
      return;
    }

    const { data, errors } = validateEnquiryInput(req.body);
    if (!data) {
      res.status(400).json({ error: 'Please correct the highlighted fields.', fieldErrors: errors });
      return;
    }

    // Idempotency: an identical submission in the last 10 minutes is treated as a duplicate
    // (double-click, retry after a slow response) and is acknowledged without a second row.
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await prisma.wholesaleEnquiry.findFirst({
      where: {
        email: data.email,
        businessName: data.businessName,
        whatsappNumber: data.whatsappNumber,
        message: data.message,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (duplicate) {
      res.status(200).json({ message: 'Thank you! Your enquiry has already been received.', duplicate: true });
      return;
    }

    const saved = await prisma.wholesaleEnquiry.create({ data });
    // Queue admin WhatsApp and email notifications asynchronously (non-blocking, cannot fail enquiry response)
    notifyWholesaleEnquirySubmitted(saved).catch((err) => {
      console.error('[Wholesale] Notification queue error:', (err as any)?.message || err);
    });

    res.status(201).json({ message: 'Thank you! Your enquiry has been received. Our team will be in touch soon.' });
  } catch (error) {
    console.error('[Wholesale] Failed to save enquiry:', (error as any)?.message || error);
    res.status(500).json({ error: 'We could not submit your enquiry right now. Please try again or contact us on WhatsApp.' });
  }
}

// ---------------------------------------------------------------------------
// ADMIN (mounted behind authenticateUser + requireAdmin in adminRoutes)
// ---------------------------------------------------------------------------
export async function getAdminWholesaleEnquiries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const search = typeof req.query.search === 'string' ? sanitizeText(req.query.search, 100) : '';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));

    const where: any = {};
    if ((WHOLESALE_STATUSES as readonly string[]).includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [enquiries, total, grouped] = await Promise.all([
      prisma.wholesaleEnquiry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.wholesaleEnquiry.count({ where }),
      prisma.wholesaleEnquiry.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const counts: Record<string, number> = { pending: 0, contacted: 0, approved: 0, rejected: 0 };
    for (const g of grouped as any[]) counts[g.status] = g._count._all;

    // Attach notification statuses if available
    const enquiryIds = enquiries.map((e) => e.id);
    let notifications: any[] = [];
    try {
      if (enquiryIds.length > 0 && (prisma as any).wholesaleNotification) {
        notifications = await (prisma as any).wholesaleNotification.findMany({
          where: { enquiryRef: { in: enquiryIds } },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch {
      // Table may not yet be migrated in dev/test; gracefully return enquiries without notif details
    }

    const notifMap = new Map<string, any[]>();
    for (const n of notifications) {
      const list = notifMap.get(n.enquiryRef) || [];
      list.push(n);
      notifMap.set(n.enquiryRef, list);
    }

    const enquiriesWithNotifs = enquiries.map((e) => ({
      ...e,
      notifications: notifMap.get(e.id) || [],
    }));

    res.status(200).json({ enquiries: enquiriesWithNotifs, total, page, limit, counts });
  } catch (error) {
    console.error('[Wholesale] Failed to list enquiries:', (error as any)?.message || error);
    res.status(500).json({ error: 'Failed to fetch wholesale enquiries.' });
  }
}

export async function updateWholesaleEnquiryStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id || '');
    const status = typeof req.body?.status === 'string' ? req.body.status.toLowerCase() : '';
    if (!(WHOLESALE_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${WHOLESALE_STATUSES.join(', ')}.` });
      return;
    }
    const existing = await prisma.wholesaleEnquiry.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    const enquiry = await prisma.wholesaleEnquiry.update({ where: { id }, data: { status } });
    res.status(200).json({ message: 'Enquiry status updated.', enquiry });
  } catch (error) {
    console.error('[Wholesale] Failed to update enquiry:', (error as any)?.message || error);
    res.status(500).json({ error: 'Failed to update enquiry status.' });
  }
}

export async function retryAdminWholesaleNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const outcome = await retryWholesaleNotification(String(req.params.id || ''));
    if (outcome === 'not_found') {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    if (outcome === 'not_failed') {
      res.status(409).json({ error: 'Only failed notifications can be retried.' });
      return;
    }
    res.status(202).json({ message: 'Retry queued.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry notification.' });
  }
}
