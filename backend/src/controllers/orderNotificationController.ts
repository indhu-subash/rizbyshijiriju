import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { retryNotification } from '../services/adminNotifications';

// GET /api/admin/order-notifications?orderRefs=a,b,c  |  ?status=failed
export async function listOrderNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const refs = typeof req.query.orderRefs === 'string' ? req.query.orderRefs.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 200) : [];
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const where: any = {};
    if (refs.length) where.orderRef = { in: refs };
    if (['pending', 'sent', 'failed'].includes(status)) where.status = status;
    const notifications = await prisma.orderNotification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function retryOrderNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const outcome = await retryNotification(String(req.params.id || ''));
    if (outcome === 'not_found') { res.status(404).json({ error: 'Notification not found.' }); return; }
    if (outcome === 'not_failed') { res.status(409).json({ error: 'Only failed notifications can be retried. Sent notifications are never resent.' }); return; }
    res.status(202).json({ message: 'Retry queued.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry notification.' });
  }
}
