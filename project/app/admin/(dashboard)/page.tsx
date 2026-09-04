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
    return <p className="muted text-center py-20">Loading dashboard metrics...</p>;
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
      value: `₹${stats?.totalRevenue.toLocaleString('en-IN')}`,
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
      color: 'var(--accent)',
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="serif text-3xl font-semibold">Store Dashboard</h1>
        </div>
      </div>

      {/* Stock warning banner if there are low/out-of-stock items */}
      {((stats?.lowStockItems || 0) > 0 || (stats?.outOfStockItems || 0) > 0) && (
        <div
          className="warning-banner mb-8 p-4 rounded flex items-center justify-between"
          style={{ background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', display: 'flex' }}
        >
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} />
            <div>
              <p className="font-medium">Inventory action required</p>
              <p className="text-xs">
                You have {stats?.outOfStockItems} items out of stock and {stats?.lowStockItems} items running low on stock.
              </p>
            </div>
          </div>
          <Link href="/admin/products" className="text-sm font-semibold hover-accent flex items-center gap-1" style={{ display: 'flex', alignItems: 'center' }}>
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
        }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="stats-card border p-6 rounded"
              style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <span className="eyebrow" style={{ color: '#777' }}>{card.title}</span>
                <p className="serif text-2xl font-bold mt-2" style={{ color: '#1a1a1a' }}>{card.value}</p>
              </div>
              <div
                className="icon-wrapper p-3 rounded-full"
                style={{ background: card.bg, color: card.color, borderRadius: '50%', padding: '12px' }}
              >
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid for recent orders and best sellers */}
      <div
        className="grid gap-8"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}
      >
        {/* Recent Orders */}
        <div className="card p-6 border rounded" style={{ background: '#fff' }}>
          <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="serif text-lg font-semibold">Recent Orders</h3>
            <Link href="/admin/orders" className="text-link text-xs">
              View all orders
            </Link>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                  <th className="pb-3 font-medium text-gray-500">Order ID</th>
                  <th className="pb-3 font-medium text-gray-500">Customer</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                    <td className="py-3 font-semibold serif">{order.orderId}</td>
                    <td className="py-3 text-gray-700">{order.shippingName}</td>
                    <td className="py-3">
                      <span className={`status-tag ${order.orderStatus.toLowerCase()}`} style={{ fontSize: '10px' }}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">₹{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="card p-6 border rounded" style={{ background: '#fff' }}>
          <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="serif text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Bestsellers Ranking
            </h3>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                  <th className="pb-3 font-medium text-gray-500">Product Name</th>
                  <th className="pb-3 font-medium text-gray-500 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {stats?.bestSellers.map((item: any, i: number) => (
                  <tr key={i} className="border-b" style={{ borderBottom: '1px solid #f7f6f2' }}>
                    <td className="py-3 font-medium text-gray-800 flex items-center gap-2">
                      <span className="text-xs muted font-bold" style={{ width: '20px' }}>{i + 1}.</span>
                      {item.name}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-700">{item.quantitySold} units</td>
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
