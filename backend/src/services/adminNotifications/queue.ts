import prisma from '../../config/db';
import { NotificationError, getEmailConfig, getWhatsAppConfig, redactSecrets } from './config';
import {
  sendAdminEmail,
  sendAdminWhatsApp,
  sendAdminWholesaleEmail,
  sendAdminWholesaleWhatsApp,
  SendResult,
} from './clients';
import { NotifyOrder, NotifyWholesaleEnquiry } from './formatters';

export type Channel = 'whatsapp' | 'email';
export const CHANNELS: Channel[] = ['whatsapp', 'email'];
export const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const LOCK_TIMEOUT_MS = 5 * 60_000;

// Overridable only by tests.
export const senders: Record<Channel, (o: NotifyOrder) => Promise<SendResult>> = { whatsapp: sendAdminWhatsApp, email: sendAdminEmail };
export const wholesaleSenders: Record<Channel, (e: NotifyWholesaleEnquiry) => Promise<SendResult>> = {
  whatsapp: sendAdminWholesaleWhatsApp,
  email: sendAdminWholesaleEmail,
};

const log = (msg: string) => console.log(`[AdminNotify] ${msg}`);

/**
 * Records that an order is confirmed and schedules delivery. Idempotent (unique orderRef+channel) and
 * NEVER throws: a failure here must not affect the confirmed order or the customer's response.
 */
export async function notifyOrderConfirmed(order: { id: string; orderId: string }): Promise<void> {
  try {
    await prisma.orderNotification.createMany({
      data: CHANNELS.map((channel) => ({ orderRef: order.id, orderNumber: order.orderId, channel, status: 'pending', nextAttemptAt: new Date() })),
      skipDuplicates: true,
    });
    setImmediate(() => { processOrderNotifications(order.id).catch((e) => log(`process error: ${redactSecrets(String(e?.message || e))}`)); });
  } catch (err: any) {
    log(`could not enqueue notifications for ${order.orderId}: ${redactSecrets(String(err?.message || err))}`);
  }
}

/**
 * Records that a wholesale enquiry has been submitted and schedules delivery.
 * Idempotent (unique enquiryRef + channel) and NEVER throws: a failure here must not affect the enquiry response.
 */
export async function notifyWholesaleEnquirySubmitted(enquiry: { id: string }): Promise<void> {
  try {
    await prisma.wholesaleNotification.createMany({
      data: CHANNELS.map((channel) => ({
        enquiryRef: enquiry.id,
        channel,
        status: 'pending',
        nextAttemptAt: new Date(),
      })),
      skipDuplicates: true,
    });
    setImmediate(() => {
      processWholesaleNotifications(enquiry.id).catch((e) =>
        log(`wholesale process error: ${redactSecrets(String(e?.message || e))}`)
      );
    });
  } catch (err: any) {
    log(`could not enqueue wholesale notification for ${enquiry.id}: ${redactSecrets(String(err?.message || err))}`);
  }
}

/** Order must really be confirmed (and for online payments, actually paid) at send time. */
export function checkEligible(o: { orderStatus: string; paymentStatus: string; paymentMethod: string }): string | null {
  if (['Cancelled', 'Refunded', 'Pending'].includes(o.orderStatus)) return `order status is ${o.orderStatus}`;
  if (['failed', 'cancelled', 'refunded'].includes((o.paymentStatus || '').toLowerCase())) return `payment status is ${o.paymentStatus}`;
  if ((o.paymentStatus || '').toLowerCase() !== 'paid') return 'online payment not verified as paid';
  return null;
}

async function finish(id: string, data: Record<string, any>) {
  await prisma.orderNotification.update({ where: { id }, data: { lockedAt: null, ...data } });
}

type Row = { id: string; orderRef: string; orderNumber: string; channel: string; attempts: number };

/** Processes one notification row. Returns the outcome. Safe to call concurrently: only one caller can claim a row. */
export async function processNotification(row: Row): Promise<'sent' | 'retry' | 'failed' | 'skipped'> {
  const now = new Date();
  const claim = await prisma.orderNotification.updateMany({
    where: { id: row.id, status: 'pending', OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } }] },
    data: { lockedAt: now, lastAttemptAt: now, attempts: { increment: 1 } },
  });
  if (claim.count !== 1) return 'skipped'; // already sent, or being handled elsewhere
  const attempts = row.attempts + 1;
  const channel = row.channel as Channel;
  try {
    const order = await prisma.order.findUnique({ where: { id: row.orderRef }, include: { items: true } });
    if (!order) throw new NotificationError('Order not found', false, 'order_missing');
    const why = checkEligible(order as any);
    if (why) throw new NotificationError(`Skipped: ${why}`, false, 'not_eligible');
    const cfg = channel === 'whatsapp' ? getWhatsAppConfig() : getEmailConfig();
    if (!cfg.ok) throw new NotificationError(`${channel} not configured (missing: ${cfg.missing.join(', ')})`, false, 'not_configured');

    const result = await senders[channel](order as unknown as NotifyOrder);
    await finish(row.id, { status: 'sent', sentAt: new Date(), providerMessageId: result.messageId, lastError: null, nextAttemptAt: null });
    log(`${channel} sent for ${row.orderNumber}${result.messageId ? ` (id ${result.messageId})` : ''}`);
    return 'sent';
  } catch (err: any) {
    const message = redactSecrets(String(err?.message || err)).slice(0, 500);
    const retriable = err instanceof NotificationError ? err.retriable : true;
    if (retriable && attempts < MAX_ATTEMPTS) {
      const wait = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
      await finish(row.id, { status: 'pending', lastError: message, nextAttemptAt: new Date(Date.now() + wait) }).catch(() => { });
      log(`${channel} failed for ${row.orderNumber} (attempt ${attempts}/${MAX_ATTEMPTS}), retry in ${Math.round(wait / 1000)}s: ${message}`);
      return 'retry';
    }
    await finish(row.id, { status: 'failed', lastError: message, nextAttemptAt: null }).catch(() => { });
    log(`${channel} FAILED for ${row.orderNumber}: ${message}`);
    return 'failed';
  }
}

type WholesaleRow = { id: string; enquiryRef: string; channel: string; attempts: number };

/** Processes one wholesale enquiry notification row. Returns the outcome. Safe for concurrent execution. */
export async function processWholesaleNotification(row: WholesaleRow): Promise<'sent' | 'retry' | 'failed' | 'skipped'> {
  const now = new Date();
  const claim = await prisma.wholesaleNotification.updateMany({
    where: {
      id: row.id,
      status: 'pending',
      OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } }],
    },
    data: { lockedAt: now, lastAttemptAt: now, attempts: { increment: 1 } },
  });
  if (claim.count !== 1) return 'skipped';
  const attempts = row.attempts + 1;
  const channel = row.channel as Channel;
  try {
    const enquiry = await prisma.wholesaleEnquiry.findUnique({ where: { id: row.enquiryRef } });
    if (!enquiry) throw new NotificationError('Wholesale enquiry not found', false, 'enquiry_missing');
    const cfg = channel === 'whatsapp' ? getWhatsAppConfig() : getEmailConfig();
    if (!cfg.ok) throw new NotificationError(`${channel} not configured (missing: ${cfg.missing.join(', ')})`, false, 'not_configured');

    const result = await wholesaleSenders[channel](enquiry as NotifyWholesaleEnquiry);
    await prisma.wholesaleNotification.update({
      where: { id: row.id },
      data: { lockedAt: null, status: 'sent', sentAt: new Date(), providerMessageId: result.messageId, lastError: null, nextAttemptAt: null },
    });
    log(`wholesale ${channel} sent for enquiry ${row.enquiryRef}${result.messageId ? ` (id ${result.messageId})` : ''}`);
    return 'sent';
  } catch (err: any) {
    const message = redactSecrets(String(err?.message || err)).slice(0, 500);
    const retriable = err instanceof NotificationError ? err.retriable : true;
    if (retriable && attempts < MAX_ATTEMPTS) {
      const wait = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
      await prisma.wholesaleNotification.update({
        where: { id: row.id },
        data: { lockedAt: null, status: 'pending', lastError: message, nextAttemptAt: new Date(Date.now() + wait) },
      }).catch(() => { });
      log(`wholesale ${channel} failed for enquiry ${row.enquiryRef} (attempt ${attempts}/${MAX_ATTEMPTS}), retry in ${Math.round(wait / 1000)}s: ${message}`);
      return 'retry';
    }
    await prisma.wholesaleNotification.update({
      where: { id: row.id },
      data: { lockedAt: null, status: 'failed', lastError: message, nextAttemptAt: null },
    }).catch(() => { });
    log(`wholesale ${channel} FAILED for enquiry ${row.enquiryRef}: ${message}`);
    return 'failed';
  }
}

/** Channels are processed independently: one failing never prevents the other. */
export async function processOrderNotifications(orderRef: string): Promise<void> {
  const rows = await prisma.orderNotification.findMany({ where: { orderRef, status: 'pending' } });
  await Promise.allSettled(rows.map((r: any) => processNotification(r)));
}

export async function processWholesaleNotifications(enquiryRef: string): Promise<void> {
  const rows = await prisma.wholesaleNotification.findMany({ where: { enquiryRef, status: 'pending' } });
  await Promise.allSettled(rows.map((r: any) => processWholesaleNotification(r)));
}

export async function processDueNotifications(limit = 10): Promise<number> {
  const now = new Date();
  const rows = await prisma.orderNotification.findMany({
    where: { status: 'pending', AND: [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, { OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } }] }] },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  await Promise.allSettled(rows.map((r: any) => processNotification(r)));
  return rows.length;
}

export async function processDueWholesaleNotifications(limit = 10): Promise<number> {
  const now = new Date();
  const rows = await prisma.wholesaleNotification.findMany({
    where: {
      status: 'pending',
      AND: [
        { OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
        { OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } }] },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  await Promise.allSettled(rows.map((r: any) => processWholesaleNotification(r)));
  return rows.length;
}

let timer: NodeJS.Timeout | null = null;
/** Persistent recovery loop: picks up anything pending (e.g. after a restart or a transient provider outage). */
export function startNotificationWorker(intervalMs = 60_000): void {
  if (timer) return;
  const tick = () => {
    processDueNotifications().catch((e) => log(`worker error: ${redactSecrets(String(e?.message || e))}`));
    processDueWholesaleNotifications().catch((e) => log(`wholesale worker error: ${redactSecrets(String(e?.message || e))}`));
  };
  setTimeout(tick, 15_000).unref?.();
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
}

/** Manual retry: ONLY failed rows can be re-queued. A sent notification is never touched. */
export async function retryNotification(id: string): Promise<'requeued' | 'not_failed' | 'not_found'> {
  const row = await prisma.orderNotification.findUnique({ where: { id }, select: { id: true, orderRef: true } });
  if (!row) return 'not_found';
  const r = await prisma.orderNotification.updateMany({ where: { id, status: 'failed' }, data: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lockedAt: null } });
  if (r.count !== 1) return 'not_failed';
  setImmediate(() => { processOrderNotifications(row.orderRef).catch(() => { }); });
  return 'requeued';
}

/** Manual retry for wholesale enquiry notification: ONLY failed rows can be re-queued. */
export async function retryWholesaleNotification(id: string): Promise<'requeued' | 'not_failed' | 'not_found'> {
  const row = await prisma.wholesaleNotification.findUnique({ where: { id }, select: { id: true, enquiryRef: true } });
  if (!row) return 'not_found';
  const r = await prisma.wholesaleNotification.updateMany({
    where: { id, status: 'failed' },
    data: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lockedAt: null },
  });
  if (r.count !== 1) return 'not_failed';
  setImmediate(() => { processWholesaleNotifications(row.enquiryRef).catch(() => { }); });
  return 'requeued';
}

