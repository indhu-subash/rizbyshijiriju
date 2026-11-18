'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

type N = { id: string; channel: 'whatsapp' | 'email'; status: 'pending' | 'sent' | 'failed'; attempts: number; lastAttemptAt: string | null; sentAt: string | null; providerMessageId: string | null; lastError: string | null };
const NAME = { whatsapp: 'WhatsApp (admin)', email: 'Email (admin)' } as const;
const COLOR = { pending: '#b45309', sent: '#15803d', failed: '#b91c1c' } as const;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

/** Shows admin WhatsApp/email notification status for one order, with a safe retry for FAILED ones only. */
export function OrderNotificationsPanel({ orderRef }: { orderRef: string }) {
  const [rows, setRows] = useState<N[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.admin.getOrderNotifications({ orderRefs: orderRef });
      setRows(res.notifications || []);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Could not load notification status.');
    }
  }, [orderRef]);

  useEffect(() => { setRows(null); load(); }, [load]);

  const retry = async (id: string) => {
    setBusy(id);
    try {
      await api.admin.retryOrderNotification(id);
      setTimeout(load, 1500);
    } catch (e: any) {
      setError(e.message || 'Retry failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
      <span className="eyebrow">Admin Notifications</span>
      {error && <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>}
      {rows === null && !error && <p className="text-sm muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="text-sm muted">No notifications recorded for this order.</p>}
      {rows && rows.map((n) => (
        <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #f7f6f2', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <strong className="text-sm">{NAME[n.channel] || n.channel}</strong>{' '}
            <span className="text-sm" style={{ color: COLOR[n.status], fontWeight: 600 }}>{n.status.toUpperCase()}</span>
            <div className="text-sm muted">
              Attempts: {n.attempts} · Last attempt: {fmt(n.lastAttemptAt)}{n.sentAt ? ` · Sent: ${fmt(n.sentAt)}` : ''}
              {n.providerMessageId ? ` · ID: ${n.providerMessageId}` : ''}
            </div>
            {n.lastError && n.status !== 'sent' && <div className="text-sm" style={{ color: '#b91c1c', wordBreak: 'break-word' }}>{n.lastError}</div>}
          </div>
          {n.status === 'failed' && (
            <button className="button secondary" style={{ padding: '6px 10px', fontSize: 12 }} disabled={busy === n.id} onClick={() => retry(n.id)}>
              <RefreshCw size={12} style={{ marginRight: 4 }} /> {busy === n.id ? 'Retrying…' : 'Retry'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
