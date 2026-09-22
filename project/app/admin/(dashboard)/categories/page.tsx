'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  group: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Collections');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.admin.getCategories();
      if (res && res.categories) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.admin.seedCategories();
      setSuccess(res.message || 'Approved categories seeded successfully.');
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to seed categories.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setGroup(cat.group);
    setDescription(cat.description || '');
    setSortOrder(String(cat.sortOrder || 0));
    setIsActive(cat.isActive);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setGroup('Collections');
    setDescription('');
    setSortOrder('0');
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      name,
      group,
      description,
      sortOrder: Number(sortOrder),
      isActive,
    };

    try {
      if (editingId) {
        await api.admin.editCategory(editingId, payload);
        setSuccess(`Category "${name}" updated successfully.`);
      } else {
        await api.admin.createCategory(payload);
        setSuccess(`Category "${name}" created successfully.`);
      }
      handleCancelForm();
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.admin.deleteCategory(id);
      setSuccess(`Category "${catName}" deleted successfully.`);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span className="eyebrow">Taxonomy Hierarchy</span>
          <h1 className="serif text-3xl font-semibold" style={{ margin: '4px 0 0' }}>
            Category Management
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="button secondary"
            onClick={handleSeed}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} /> Seed Standard Categories
          </button>
          {!showForm && (
            <button
              className="button"
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fdf2f2',
            border: '1px solid #f8b4b4',
            color: '#9b1c1c',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#f3faf7',
            border: '1px solid #a3e6cd',
            color: '#0e6245',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Form Drawer / Box */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--gold)',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <h3 className="serif text-xl font-semibold mb-4 border-b pb-2">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              Category Name *
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anti-Tarnish"
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              Group Taxonomy *
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="Collections">Collections</option>
                <option value="Replica">Replica</option>
                <option value="Fashion">Fashion</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              Sort Order
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '24px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ accentColor: 'var(--sage)' }}
              />
              Active & Visible
            </label>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <label>Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for editorial cards..."
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="button" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : editingId ? 'Update Category' : 'Save Category'}
            </button>
            <button className="button secondary" type="button" onClick={handleCancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Loader2 size={28} className="animate-spin mx-auto" style={{ color: 'var(--gold)' }} />
            <p className="muted" style={{ marginTop: '12px' }}>
              Loading category hierarchy...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p className="muted">No categories exist yet.</p>
            <button className="button" onClick={handleSeed} style={{ marginTop: '16px' }}>
              Seed Standard Approved Categories
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9f8f5', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>
                <th style={{ padding: '14px 20px' }}>Group</th>
                <th style={{ padding: '14px 20px' }}>Category Name</th>
                <th style={{ padding: '14px 20px' }}>Slug</th>
                <th style={{ padding: '14px 20px' }}>Linked Products</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '500', color: 'var(--sage)' }}>{cat.group}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '600' }}>{cat.name}</td>
                  <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>{cat.slug}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        background: '#f4f3ef',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {cat._count?.products || 0} product(s)
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: cat.isActive ? '#e6f4ea' : '#fce8e6',
                        color: cat.isActive ? '#137333' : '#c5221f',
                      }}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEditClick(cat)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brown)',
                        cursor: 'pointer',
                        marginRight: '12px',
                      }}
                      title="Edit Category"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d9534f',
                        cursor: 'pointer',
                      }}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
