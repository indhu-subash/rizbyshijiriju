'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Mail, Phone, Calendar } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCustomers();
      setCustomers(res.customers);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="eyebrow">Audience</span>
        <h1 className="serif text-3xl font-semibold">Customers Directory</h1>
      </div>

      {/* Filters Bar */}
      <div
        className="filters-bar border p-4 rounded mb-6"
        style={{
          background: '#fff',
          display: 'grid',
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '35px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#888' }} />
        </div>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {/* Table */}
      {loading ? (
        <p className="muted text-center py-10">Fetching customers...</p>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white">
          <p className="muted">No customers found.</p>
        </div>
      ) : (
        <div className="table-responsive border rounded bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px' }}>Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Registered Date</th>
                <th>Total Orders</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                  <td style={{ padding: '16px' }} className="serif font-semibold">
                    {c.name}
                  </td>
                  <td>
                    <span className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} className="muted" /> {c.email}
                    </span>
                  </td>
                  <td>
                    {c.phone ? (
                      <span className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} className="muted" /> {c.phone}
                      </span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} className="muted" /> {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold">{c.orderCount} orders</span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }} className="serif font-bold text-gray-800">
                    ₹{c.totalSpent.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
