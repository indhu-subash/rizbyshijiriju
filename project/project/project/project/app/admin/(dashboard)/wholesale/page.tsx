'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Mail, Phone, MapPin, Calendar } from 'lucide-react';

type EnquiryNotif = {
  id: string;
  channel: 'whatsapp' | 'email';
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastError?: string | null;
};

type Enquiry = {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  location: string;
  estimatedQuantity: number;
  message: string | null;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  createdAt: string;
  notifications?: EnquiryNotif[];
};

const STATUSES: Enquiry['status'][] = ['pending', 'contacted', 'approved', 'rejected'];
const LABEL: Record<string, string> = { pending: 'Pending', contacted: 'Contacted', approved: 'Approved', rejected: 'Rejected' };
const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '')}`;

export default function AdminWholesale() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const retryNotif = async (notifId: string) => {
    setRetryingId(notifId);
    setError('');
    try {
      await api.admin.retryWholesaleNotification(notifId);
      setTimeout(load, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to retry notification.');
    } finally {
      setRetryingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (filter) params.status = filter;
      if (query) params.search = query;
      const res = await api.admin.getWholesaleEnquiries(params);
      setEnquiries(res.enquiries || []);
      setCounts(res.counts || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load wholesale enquiries.');
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const changeStatus = async (id: string, status: Enquiry['status']) => {
    const previous = enquiries;
    setSavingId(id);
    setError('');
    setEnquiries((list) => list.map((e) => (e.id === id ? { ...e, status } : e)));
    try {
      await api.admin.updateWholesaleEnquiryStatus(id, status);
      load(); // refresh counts
    } catch (err: any) {
      setEnquiries(previous);
      setError(err.message || 'Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  const total = STATUSES.reduce((n, s) => n + (counts[s] || 0), 0);

  return (
    <div>
      <div className="mb-8">
        <span className="eyebrow">Wholesale</span>
        <h1 className="serif text-3xl font-semibold">Wholesale Enquiries</h1>
      </div>

      <div className="ws-admin-tabs" role="tablist" aria-label="Filter by status">
        <button role="tab" aria-selected={filter === ''} className={filter === '' ? 'active' : ''} onClick={() => setFilter('')}>
          All ({total})
        </button>
        {STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {LABEL[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="filters-bar border p-4 rounded mb-6" style={{ background: '#fff' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search name, business, email or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '35px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#888' }} />
        </div>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {loading ? (
        <p className="muted text-center py-10">Fetching enquiries...</p>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white">
          <p className="muted">No wholesale enquiries found.</p>
        </div>
      ) : (
        <div className="table-responsive border rounded bg-white">
          <table className="w-full text-sm text-left ws-admin-table">
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px' }}>Customer</th>
                <th>Business</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Est. Qty</th>
                <th>Submitted</th>
                <th style={{ paddingRight: '16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <Fragment key={e.id}>
                  <tr style={{ borderBottom: '1px solid #f7f6f2', verticalAlign: 'top' }}>
                    <td style={{ padding: '16px' }} className="serif font-semibold">
                      {e.fullName}
                      {e.message && (
                        <div>
                          <button type="button" className="ws-admin-link" onClick={() => setOpenId(openId === e.id ? null : e.id)} aria-expanded={openId === e.id}>
                            {openId === e.id ? 'Hide message' : 'View message'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{e.businessName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={13} className="muted" /> <a href={`mailto:${e.email}`}>{e.email}</a></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={13} className="muted" /> <a href={waLink(e.whatsappNumber)} target="_blank" rel="noopener noreferrer">{e.whatsappNumber}</a></div>
                    </td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} className="muted" /> {e.location}</span></td>
                    <td className="font-semibold">{e.estimatedQuantity.toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} className="muted" /> {new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {e.notifications && e.notifications.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {e.notifications.map((n) => (
                            <span
                              key={n.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 10,
                                padding: '1px 5px',
                                borderRadius: 3,
                                background: n.status === 'sent' ? '#e6f4ea' : n.status === 'failed' ? '#fce8e6' : '#fef7e0',
                                color: n.status === 'sent' ? '#137333' : n.status === 'failed' ? '#c5221f' : '#b06000',
                                fontWeight: 500,
                              }}
                              title={n.lastError || undefined}
                            >
                              {n.channel === 'whatsapp' ? 'WA' : 'Mail'}:{n.status.toUpperCase()}
                              {n.status === 'failed' && (
                                <button
                                  type="button"
                                  className="ws-admin-link"
                                  style={{ fontSize: 9, color: '#c5221f', marginLeft: 2, padding: 0 }}
                                  onClick={() => retryNotif(n.id)}
                                  disabled={retryingId === n.id}
                                  aria-label="Retry notification"
                                >
                                  {retryingId === n.id ? '…' : '↻'}
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ paddingRight: '16px' }}>
                      <select
                        value={e.status}
                        disabled={savingId === e.id}
                        onChange={(ev) => changeStatus(e.id, ev.target.value as Enquiry['status'])}
                        aria-label={`Status for ${e.fullName}`}
                        className={`ws-status-select ws-status-${e.status}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {openId === e.id && e.message && (
                    <tr style={{ background: '#faf9f6' }}>
                      <td colSpan={7} style={{ padding: '14px 16px', whiteSpace: 'pre-wrap' }}>{e.message}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
