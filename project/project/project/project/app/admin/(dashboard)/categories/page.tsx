'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, RefreshCw, X, Tag } from 'lucide-react';

type Category = {
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
};

const GROUPS = ['Collections', 'Replica', 'Fashion'];

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Collections');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.admin.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await api.admin.seedCategories();
      alert(res.message || 'Default categories seeded successfully.');
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to seed categories.');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setGroup('Collections');
    setDescription('');
    setSortOrder('0');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setGroup(cat.group);
    setDescription(cat.description || '');
    setSortOrder(String(cat.sortOrder || 0));
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      group,
      description: description || undefined,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    };

    try {
      if (editingCategory) {
        await api.admin.editCategory(editingCategory.id, payload);
      } else {
        await api.admin.createCategory(payload);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await api.admin.deleteCategory(cat.id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = cat.name.toLowerCase().includes(q) || (cat.description || '').toLowerCase().includes(q);
    const matchesGroup = !groupFilter || cat.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--accent, #a9895b)' }}>Catalog</span>
          <h1 className="serif text-3xl font-semibold" style={{ fontSize: '28px', margin: '4px 0 0' }}>Manage Categories</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="button secondary flex items-center gap-2"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} />
            {seeding ? 'Seeding...' : 'Seed Defaults'}
          </button>
          <button onClick={openCreateModal} className="button flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Category
          </button>
        </div>
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
          borderRadius: '8px',
          border: '1px solid #e9e5df',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '35px', width: '100%' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#888' }} />
        </div>

        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{ width: '100%' }}>
          <option value="">All Groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {/* Table */}
      {loading ? (
        <p className="muted text-center py-10" style={{ textAlign: 'center', padding: '40px 0' }}>
          Loading categories...
        </p>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white" style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '8px', border: '1px solid #e9e5df' }}>
          <Tag size={36} className="muted mb-3" style={{ margin: '0 auto 12px', color: '#aaa' }} />
          <p className="muted mb-4">No categories found.</p>
          <button onClick={handleSeedDefaults} className="button secondary">
            Seed Initial Store Categories
          </button>
        </div>
      ) : (
        <div className="table-responsive border rounded bg-white" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e9e5df', overflowX: 'auto' }}>
          <table className="w-full text-sm text-left" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px' }}>Category Name</th>
                <th>Group</th>
                <th>Slug</th>
                <th>Sort Order</th>
                <th>Linked Products</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                  <td style={{ padding: '16px' }} className="serif font-semibold">
                    <div>
                      <span>{cat.name}</span>
                      {cat.description && <p className="text-xs muted" style={{ margin: '2px 0 0', fontWeight: 'normal', color: '#666' }}>{cat.description}</p>}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: cat.group === 'Collections' ? '#eef2fc' : cat.group === 'Replica' ? '#f0f3e8' : '#fbfaf7',
                        color: cat.group === 'Collections' ? '#3b5998' : cat.group === 'Replica' ? '#4b5320' : '#888',
                        fontWeight: '600',
                        fontSize: '11px',
                      }}
                    >
                      {cat.group}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: '#666' }}>{cat.slug}</td>
                  <td>{cat.sortOrder}</td>
                  <td className="font-semibold">{cat._count?.products || 0}</td>
                  <td>
                    <span className={`status-tag ${cat.isActive ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div className="flex justify-end gap-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="text-link flex items-center gap-1" onClick={() => openEditModal(cat)}>
                        <Edit size={14} /> Edit
                      </button>
                      <button className="text-red-500 hover:text-red-700 flex items-center gap-1" style={{ color: '#d32f2f' }} onClick={() => handleDelete(cat)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
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
              maxWidth: '500px',
              width: '100%',
              borderRadius: '8px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <span className="eyebrow mb-1 block">{editingCategory ? 'Edit Category' : 'Create Category'}</span>
            <h3 className="serif text-xl font-semibold mb-6">{editingCategory ? editingCategory.name : 'New Category'}</h3>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                Category Name
                <input
                  required
                  type="text"
                  placeholder="e.g. AD Collections"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                Group
                <select value={group} onChange={(e) => setGroup(e.target.value)}>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                Description
                <textarea
                  placeholder="Short category summary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                  Sort Order
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '500', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active Category</span>
                </label>
              </div>

              <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button className="button" type="submit" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button className="button secondary" type="button" onClick={() => setIsModalOpen(false)}>
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
