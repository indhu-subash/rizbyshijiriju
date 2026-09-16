'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, MapPin, Search, Edit2, Check, X } from 'lucide-react';

type ShippingRule = {
  id: string;
  pincode: string;
  shippingCharge: number;
  createdAt: string;
  updatedAt: string;
};

export default function AdminShipping() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form State
  const [pincode, setPincode] = useState('');
  const [shippingCharge, setShippingCharge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPincode, setEditPincode] = useState('');
  const [editCharge, setEditCharge] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getShippingRules();
      setRules(res.rules || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipping rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    const cleanPincode = pincode.trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      setFormError('Pincode must be exactly 6 digits.');
      setSubmitting(false);
      return;
    }

    const chargeNum = parseFloat(shippingCharge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      setFormError('Shipping charge must be a valid number greater than or equal to 0.');
      setSubmitting(false);
      return;
    }

    try {
      await api.admin.createShippingRule({
        pincode: cleanPincode,
        shippingCharge: chargeNum,
      });
      setFormSuccess(`Shipping rule for pincode ${cleanPincode} created successfully.`);
      setPincode('');
      setShippingCharge('');
      loadRules();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create shipping rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (rule: ShippingRule) => {
    setEditingId(rule.id);
    setEditPincode(rule.pincode);
    setEditCharge(rule.shippingCharge.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPincode('');
    setEditCharge('');
  };

  const handleSaveEdit = async (id: string) => {
    const cleanPincode = editPincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      alert('Pincode must be exactly 6 digits.');
      return;
    }

    const chargeNum = parseFloat(editCharge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      alert('Shipping charge must be a valid number greater than or equal to 0.');
      return;
    }

    setEditSubmitting(true);
    try {
      await api.admin.editShippingRule(id, {
        pincode: cleanPincode,
        shippingCharge: chargeNum,
      });
      setEditingId(null);
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Failed to update shipping rule.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string, pincode: string) => {
    if (!confirm(`Are you sure you want to delete shipping rule for pincode ${pincode}?`)) return;
    try {
      await api.admin.deleteShippingRule(id);
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Failed to delete shipping rule.');
    }
  };

  const filteredRules = rules.filter((r) =>
    r.pincode.includes(searchQuery.trim())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="eyebrow">Logistics & Rates</span>
        <h1 className="serif text-3xl font-semibold">Shipping Rates</h1>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: '1fr 2fr' }}>
        {/* Create Rule Card */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
          <h3 className="serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} style={{ color: 'var(--accent)' }} /> Add Pincode Rate
          </h3>

          {formError && <div className="error-banner mb-4 text-xs">{formError}</div>}
          {formSuccess && <div className="success-banner mb-4 text-xs">{formSuccess}</div>}

          <form onSubmit={handleCreateRule} style={{ display: 'grid', gap: '15px' }}>
            <label>
              Pincode (6 digits) *
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 600001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={submitting}
              />
            </label>

            <label>
              Shipping Charge (INR) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 79 or 0 for free"
                value={shippingCharge}
                onChange={(e) => setShippingCharge(e.target.value)}
                disabled={submitting}
              />
            </label>

            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Shipping Rule'}
            </button>
          </form>
        </div>

        {/* Shipping Rules Table */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="serif text-lg font-semibold">Configured Pincodes ({filteredRules.length})</h3>
            
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                placeholder="Search pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.85rem', height: '36px' }}
              />
            </div>
          </div>

          {loading ? (
            <p className="muted text-center py-10">Loading shipping rules...</p>
          ) : filteredRules.length === 0 ? (
            <p className="muted text-center py-10">
              {searchQuery ? 'No matching pincodes found.' : 'No shipping rules configured yet.'}
            </p>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ paddingBottom: '12px' }}>Pincode</th>
                    <th>Shipping Charge</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => {
                    const isEditing = editingId === rule.id;
                    return (
                      <tr key={rule.id} className="border-b" style={{ borderBottom: '1px solid #f7f6f2' }}>
                        <td className="py-3 font-semibold serif">
                          {isEditing ? (
                            <input
                              type="text"
                              maxLength={6}
                              value={editPincode}
                              onChange={(e) => setEditPincode(e.target.value)}
                              style={{ width: '90px', padding: '4px 8px', fontSize: '0.85rem' }}
                            />
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} style={{ color: 'var(--accent)' }} />
                              {rule.pincode}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editCharge}
                              onChange={(e) => setEditCharge(e.target.value)}
                              style={{ width: '90px', padding: '4px 8px', fontSize: '0.85rem' }}
                            />
                          ) : (
                            rule.shippingCharge === 0 ? 'Free (₹0)' : `₹${rule.shippingCharge.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="text-xs muted">
                          {new Date(rule.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                className="text-green-600 hover:text-green-800"
                                onClick={() => handleSaveEdit(rule.id)}
                                disabled={editSubmitting}
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={cancelEdit}
                                disabled={editSubmitting}
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => startEdit(rule)}
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(rule.id, rule.pincode)}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
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
