'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number;
  isActive: boolean;
  usageCount: number;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCoupons();
      setCoupons(res.coupons);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const payload = {
      code: code.trim().toUpperCase(),
      discountType: type,
      discountValue: Number(value),
      minOrderValue: Number(minPurchase),
      type,
      value: Number(value),
      minPurchase: Number(minPurchase),
      isActive: true,
    };

    try {
      await api.admin.createCoupon(payload);
      setFormSuccess(`Coupon ${payload.code} created successfully.`);
      setCode('');
      setValue('');
      setMinPurchase('0');
      loadCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) return;
    try {
      await api.admin.deleteCoupon(id);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="eyebrow">Promotions</span>
        <h1 className="serif text-3xl font-semibold">Manage Coupons</h1>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: '1fr 2fr' }}>
        {/* Create Coupon Card */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
          <h3 className="serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} style={{ color: 'var(--accent)' }} /> Create Coupon
          </h3>

          {formError && <div className="error-banner mb-4 text-xs">{formError}</div>}
          {formSuccess && <div className="success-banner mb-4 text-xs">{formSuccess}</div>}

          <form onSubmit={handleCreateCoupon} style={{ display: 'grid', gap: '15px' }}>
            <label>
              Promo Code *
              <input
                required
                type="text"
                placeholder="e.g. FESTIVE20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ textTransform: 'uppercase' }}
                disabled={submitting}
              />
            </label>

            <label>
              Discount Type *
              <select value={type} onChange={(e) => setType(e.target.value)} disabled={submitting}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (INR)</option>
              </select>
            </label>

            <label>
              Discount Value *
              <input
                required
                type="number"
                min="0"
                placeholder={type === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 100 for ₹100 off'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={submitting}
              />
            </label>

            <label>
              Minimum Order Subtotal (INR)
              <input
                required
                type="number"
                min="0"
                placeholder="0"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                disabled={submitting}
              />
            </label>

            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 className="serif text-lg font-semibold mb-4">Active Promotions</h3>

          {loading ? (
            <p className="muted text-center py-10">Fetching promo codes...</p>
          ) : coupons.length === 0 ? (
            <p className="muted text-center py-10">No coupons registered yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ paddingBottom: '12px' }}>Code</th>
                    <th>Discount</th>
                    <th>Min Spend</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c: any) => {
                    const couponType = c.discountType || c.type;
                    const couponVal = c.discountValue ?? c.value ?? 0;
                    const minSpend = c.minOrderValue ?? c.minPurchase ?? 0;
                    const usage = c.usedCount ?? c.usageCount ?? 0;

                    return (
                      <tr key={c.id} className="border-b" style={{ borderBottom: '1px solid #f7f6f2' }}>
                        <td className="py-3 font-semibold serif" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag size={14} style={{ color: 'var(--accent)' }} />
                          {c.code}
                        </td>
                        <td>
                          {couponType === 'percentage' ? `${couponVal}% Off` : `₹${couponVal} Off`}
                        </td>
                        <td>₹{minSpend}</td>
                        <td>{usage} times</td>
                        <td>
                          <span className={`status-tag ${c.isActive ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                            {c.isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
