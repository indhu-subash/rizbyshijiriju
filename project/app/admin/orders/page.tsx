'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Eye, Edit2, Loader2, X } from 'lucide-react';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  orderId: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderItem[];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Edit Status State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOrders(statusFilter || undefined);
      setOrders(res.orders);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    setUpdating(true);
    try {
      await api.admin.updateOrderStatus(editingOrder.id, {
        orderStatus: newStatus,
        trackingNumber: trackingNumber || undefined,
      });
      setEditingOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.shippingName.toLowerCase().includes(q) ||
      o.shippingEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="eyebrow">Fulfillment</span>
        <h1 className="serif text-3xl font-semibold">Customer Orders</h1>
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
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '35px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#888' }} />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending Payment</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {/* Listing */}
      {loading ? (
        <p className="muted text-center py-10">Fetching order history...</p>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white">
          <p className="muted">No orders found.</p>
        </div>
      ) : (
        <div className="table-responsive border rounded bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px' }}>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                  <td style={{ padding: '16px' }} className="serif font-semibold">
                    {o.orderId}
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">{o.shippingName}</p>
                      <p className="text-xs muted">{o.shippingEmail}</p>
                    </div>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="font-semibold">₹{o.total}</td>
                  <td>
                    <span className={`status-tag ${o.orderStatus.toLowerCase()}`} style={{ fontSize: '10px' }}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${o.paymentStatus === 'paid' ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                      {o.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div className="flex justify-end gap-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="text-link flex items-center gap-1" onClick={() => setSelectedOrder(o)}>
                        <Eye size={14} /> View
                      </button>
                      <button
                        className="text-link flex items-center gap-1"
                        onClick={() => {
                          setEditingOrder(o);
                          setNewStatus(o.orderStatus);
                          setTrackingNumber(o.trackingNumber || '');
                        }}
                      >
                        <Edit2 size={14} /> Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1. ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '650px',
              width: '100%',
              borderRadius: '8px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <span className="eyebrow mb-2 block">Order Invoice</span>
            <h2 className="serif text-2xl font-semibold mb-4">{selectedOrder.orderId}</h2>
            
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
              <div>
                <span className="eyebrow">Customer Contact</span>
                <p className="font-semibold">{selectedOrder.shippingName}</p>
                <p className="text-sm muted">{selectedOrder.shippingEmail}</p>
                <p className="text-sm muted">{selectedOrder.shippingPhone}</p>
              </div>
              <div>
                <span className="eyebrow">Shipping Address</span>
                <p className="text-sm">{selectedOrder.shippingAddressLine}</p>
                <p className="text-sm">
                  {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <span className="eyebrow">Items Summary</span>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {item.name} <small className="muted">× {item.quantity}</small>
                  </span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span className="eyebrow">Payment Method</span>
                <p className="text-sm font-medium">{selectedOrder.paymentMethod.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <span className="muted">Total Order Value</span>
                <p className="serif text-xl font-bold">₹{selectedOrder.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT STATUS MODAL */}
      {editingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '450px',
              width: '100%',
              borderRadius: '8px',
              padding: '24px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setEditingOrder(null)}
              style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <span className="eyebrow mb-1 block">Transition status for</span>
            <h3 className="serif text-xl font-semibold mb-4">{editingOrder.orderId}</h3>

            <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gap: '15px' }}>
              <label>
                Fulfillment Status
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="Pending">Pending Payment</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>

              {(newStatus === 'Shipped' || newStatus === 'Out for Delivery') && (
                <label>
                  Delivery Tracking Number
                  <input
                    type="text"
                    placeholder="e.g. FedEx / India Post ID"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                </label>
              )}

              <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px' }}>
                <button className="button" type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button className="button secondary" type="button" onClick={() => setEditingOrder(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
