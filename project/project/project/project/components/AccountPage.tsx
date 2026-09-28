'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from './StoreProvider';

type Address = {
  id: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
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
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
};

export function AccountPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  
  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load addresses & orders
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const data = await api.auth.getAddresses();
      setAddresses(data.addresses);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.orders.my();
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      logout();
      router.push('/login');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');

    try {
      await api.auth.addAddress(newAddress);
      setSuccess('Address added successfully.');
      setShowAddressForm(false);
      setNewAddress({
        name: '',
        phone: '',
        email: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
      loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to add address.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.auth.deleteAddress(id);
      loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address.');
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="muted">Loading your account...</p>
      </div>
    );
  }

  return (
    <main>
      <div className="content-hero container">
        <span className="eyebrow">Your Account</span>
        <h1 className="serif">Welcome back, {user.name}</h1>
        <p className="muted">Manage your details, track shipping, and review your purchase history.</p>
      </div>

      <section className="container section">
        <div className="account-dashboard">
          <div className="account-nav">
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
            </button>
            <button
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              Order History
            </button>
            <button
              className={activeTab === 'addresses' ? 'active' : ''}
              onClick={() => setActiveTab('addresses')}
            >
              Addresses
            </button>
            <Link href="/wishlist">Wishlist</Link>
            {user.role === 'admin' && <Link href="/admin" style={{ color: 'var(--accent)' }}>Admin Dashboard</Link>}
            <button className="text-left" onClick={handleLogout} style={{ color: '#d9534f' }}>
              Sign Out
            </button>
          </div>

          <div className="account-panel">
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="serif">Your Profile Info</h2>
                <p className="muted mb-6">These details are used for quick and easy checkout checks.</p>
                <div className="grid-details" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="info-card">
                    <span className="eyebrow">Name</span>
                    <p className="serif text-lg">{user.name}</p>
                  </div>
                  <div className="info-card">
                    <span className="eyebrow">Email Address</span>
                    <p className="serif text-lg">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div className="info-card">
                      <span className="eyebrow">Phone Number</span>
                      <p className="serif text-lg">{user.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="serif">Purchase History</h2>
                <p className="muted mb-6">View details and tracking links for your orders.</p>

                {loadingOrders ? (
                  <p className="muted">Loading your order details...</p>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="muted mb-4">You have not placed any orders yet.</p>
                    <Link href="/shop" className="button">Shop our collections</Link>
                  </div>
                ) : selectedOrder ? (
                  <div className="order-details-card">
                    <button className="text-link mb-4 block" onClick={() => setSelectedOrder(null)}>
                      ← Back to all orders
                    </button>
                    <div className="flex justify-between border-b pb-4 mb-4">
                      <div>
                        <span className="eyebrow">Order ID</span>
                        <h3 className="serif">{selectedOrder.orderId}</h3>
                        <p className="muted">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="eyebrow">Status</span>
                        <div className={`status-tag ${selectedOrder.orderStatus.toLowerCase()}`}>
                          {selectedOrder.orderStatus}
                        </div>
                        <p className="muted">Payment: {selectedOrder.paymentStatus.toUpperCase()}</p>
                      </div>
                    </div>

                    {selectedOrder.trackingNumber && (
                      <div className="tracking-info-banner mb-6">
                        <span className="eyebrow">Tracking Number</span>
                        <p className="serif">{selectedOrder.trackingNumber}</p>
                        <Link href={`/track-order?order=${selectedOrder.orderId}`} className="text-link text-sm mt-1 block">
                          Track Live Delivery Status →
                        </Link>
                      </div>
                    )}

                    <div className="items-list mb-6">
                      <span className="eyebrow">Items Purchased</span>
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-3 border-b">
                          <div className="flex items-center gap-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            )}
                            <div>
                              <p className="serif font-medium">{item.name}</p>
                              <p className="muted text-sm">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="serif font-medium">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-right">
                      <span className="muted">Total Paid</span>
                      <p className="serif text-xl font-semibold">₹{selectedOrder.total}</p>
                    </div>
                  </div>
                ) : (
                  <div className="orders-table-wrapper">
                    <table className="orders-table w-full">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td><b className="serif">{order.orderId}</b></td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-tag ${order.orderStatus.toLowerCase()}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td>₹{order.total}</td>
                            <td>
                              <button className="text-link" onClick={() => setSelectedOrder(order)}>
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="serif">Saved Addresses</h2>
                    <p className="muted">Manage your default shipping addresses.</p>
                  </div>
                  {!showAddressForm && (
                    <button className="button" onClick={() => setShowAddressForm(true)}>
                      Add New Address
                    </button>
                  )}
                </div>

                {error && <div className="error-banner mb-4">{error}</div>}
                {success && <div className="success-banner mb-4">{success}</div>}

                {showAddressForm ? (
                  <div className="address-form-wrapper border p-6 rounded mb-8">
                    <h3 className="serif mb-4">New Shipping Address</h3>
                    <form onSubmit={handleAddAddress}>
                      <div className="form-grid" style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
                        <label className="col-span-2">
                          Recipient Name
                          <input
                            required
                            type="text"
                            placeholder="Full Name"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label>
                          Mobile Phone
                          <input
                            required
                            type="tel"
                            placeholder="10-digit number"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label>
                          Email
                          <input
                            required
                            type="email"
                            placeholder="Recipient Email"
                            value={newAddress.email}
                            onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label className="col-span-2">
                          Street Address / House details
                          <input
                            required
                            type="text"
                            placeholder="Flat/House no, Street Name, Area"
                            value={newAddress.addressLine}
                            onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label>
                          City
                          <input
                            required
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label>
                          State
                          <input
                            required
                            type="text"
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label>
                          Pincode
                          <input
                            required
                            type="text"
                            maxLength={6}
                            placeholder="6-digit Pincode"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                            disabled={loadingAction}
                          />
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer', flexDirection: 'row', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                            disabled={loadingAction}
                            style={{ width: 'auto', marginBottom: 0 }}
                          />
                          Set as Default Shipping Address
                        </label>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button className="button" type="submit" disabled={loadingAction}>
                          {loadingAction ? 'Saving...' : 'Save Address'}
                        </button>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          disabled={loadingAction}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="muted">You have no saved addresses yet.</p>
                ) : (
                  <div className="addresses-grid" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`address-card border p-4 rounded ${addr.isDefault ? 'default-border' : ''}`} style={{ position: 'relative' }}>
                        {addr.isDefault && (
                          <span className="default-badge eyebrow" style={{ position: 'absolute', top: '15px', right: '15px' }}>
                            Default
                          </span>
                        )}
                        <h4 className="serif font-semibold">{addr.name}</h4>
                        <p className="text-sm mt-2">{addr.addressLine}</p>
                        <p className="text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-xs muted mt-3">Phone: {addr.phone}</p>
                        <p className="text-xs muted">Email: {addr.email}</p>
                        <div className="mt-4 flex gap-4">
                          <button className="text-link text-xs text-red-500" onClick={() => handleDeleteAddress(addr.id)}>
                            Delete Address
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
