'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  IndianRupee,
  ShoppingBag,
  Gem,
  Users,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentOrders: any[];
  bestSellers: any[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.admin.getStats();
        setStats(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <p className="muted text-center py-20" style={{ textAlign: 'center', padding: '80px 0' }}>Loading dashboard metrics...</p>;
  }

  if (error) {
    return (
      <div className="error-banner max-w-md mx-auto my-10 p-4 text-center">
        <p className="font-semibold mb-2">Metrics Unavailable</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: '#4b5320',
      bg: '#f0f3e8',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: '#3b5998',
      bg: '#eef2fc',
    },
    {
      title: 'Active Products',
      value: stats?.totalProducts || 0,
      icon: Gem,
      color: 'var(--accent, #a9895b)',
      bg: '#fbfaf7',
    },
    {
      title: 'Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: '#17a2b8',
      bg: '#e2f7fa',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8" style={{ marginBottom: '28px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--gold, #a9895b)' }}>Overview</span>
          <h1 className="serif text-3xl font-semibold" style={{ fontSize: '28px', margin: '4px 0 0' }}>Store Dashboard</h1>
        </div>
      </div>

      {/* Stock warning banner if there are low/out-of-stock items */}
      {((stats?.lowStockItems || 0) > 0 || (stats?.outOfStockItems || 0) > 0) && (
        <div
          className="warning-banner mb-8 p-4 rounded flex items-center justify-between"
          style={{
            background: '#fff3cd',
            border: '1px solid #ffeeba',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '28px',
          }}
        >
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} />
            <div>
              <p className="font-medium" style={{ fontWeight: 600, margin: 0 }}>Inventory action required</p>
              <p className="text-xs" style={{ fontSize: '12px', margin: '2px 0 0', opacity: 0.9 }}>
                You have {stats?.outOfStockItems} items out of stock and {stats?.lowStockItems} items running low on stock.
              </p>
            </div>
          </div>
          <Link href="/admin/products" className="text-sm font-semibold hover-accent flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#856404' }}>
            Restock Inventory <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div
        className="grid mb-8"
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginBottom: '32px',
        }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="stats-card border p-6 rounded"
              style={{
                background: '#fff',
                padding: '20px 24px',
                borderRadius: '8px',
                border: '1px solid #e9e5df',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <span className="eyebrow" style={{ color: '#777', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {card.title}
                </span>
                <p className="serif text-2xl font-bold mt-2" style={{ color: '#1a1a1a', margin: '6px 0 0', fontSize: '24px', fontWeight: 700 }}>
                  {card.value}
                </p>
              </div>
              <div
                className="icon-wrapper p-3 rounded-full"
                style={{
                  background: card.bg,
                  color: card.color,
                  borderRadius: '50%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid for recent orders and best sellers */}
      <div
        className="grid gap-8"
        style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}
      >
        {/* Recent Orders */}
        <div className="card p-6 border rounded" style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e9e5df', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="serif text-lg font-semibold" style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>Recent Orders</h3>
            <Link href="/admin/orders" className="text-link text-xs" style={{ fontSize: '12px', color: 'var(--gold, #a9895b)' }}>
              View all orders
            </Link>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm text-left" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Order ID</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Customer</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders || []).map((order: any) => (
                  <tr key={order.id || order.orderId} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                    <td style={{ padding: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{order.orderId}</td>
                    <td style={{ padding: '12px', color: '#444', whiteSpace: 'nowrap' }}>{order.shippingName || 'Customer'}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span
                        className={`status-tag ${String(order.orderStatus || 'Pending').toLowerCase()}`}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: '#f0ede6',
                          color: '#444',
                          textTransform: 'capitalize',
                          display: 'inline-block',
                        }}
                      >
                        {order.orderStatus || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>₹{(order.total || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="card p-6 border rounded" style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e9e5df', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="serif text-lg font-semibold flex items-center gap-2" style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <TrendingUp size={18} style={{ color: 'var(--accent, #a9895b)' }} /> Bestsellers Ranking
            </h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm text-left" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Product Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.bestSellers || []).map((item: any, i: number) => (
                  <tr key={i} className="border-b" style={{ borderBottom: '1px solid #f7f6f2' }}>
                    <td style={{ padding: '12px', color: '#333', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '700', marginRight: '8px', color: '#888' }}>{i + 1}.</span>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#444', whiteSpace: 'nowrap' }}>{item.quantitySold || 0} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
