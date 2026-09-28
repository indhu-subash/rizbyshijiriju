'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Sparkles,
  Layers,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  AlertTriangle,
  Package,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';

type CollectionItem = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
};

export default function AdminCollections() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });
  const [customSlugEdited, setCustomSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.admin.getCollections();
      setCollections(res.collections || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load collections list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      image: '',
      description: '',
      sortOrder: (collections.length + 1) * 10,
      isActive: true,
    });
    setCustomSlugEdited(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (col: CollectionItem) => {
    setEditingCollection(col);
    setFormData({
      name: col.name,
      slug: col.slug,
      image: col.image || '',
      description: col.description || '',
      sortOrder: col.sortOrder || 0,
      isActive: col.isActive,
    });
    setCustomSlugEdited(true);
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: customSlugEdited ? prev.slug : generateSlug(val),
    }));
  };

  const handleSlugChange = (val: string) => {
    setCustomSlugEdited(true);
    setFormData((prev) => ({ ...prev, slug: generateSlug(val) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await api.admin.uploadImage(file);
      if (result && result.url) {
        setFormData((prev) => ({ ...prev, image: result.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload collection image to R2.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Collection name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingCollection) {
        await api.admin.updateCollection(editingCollection.id, formData);
        setSuccessMsg(`Collection "${formData.name}" updated successfully.`);
      } else {
        await api.admin.createCollection(formData);
        setSuccessMsg(`Collection "${formData.name}" created successfully.`);
      }
      setShowModal(false);
      await loadCollections();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (col: CollectionItem) => {
    try {
      await api.admin.toggleCollectionActive(col.id);
      setCollections((prev) =>
        prev.map((item) => (item.id === col.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle active status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.admin.deleteCollection(deleteTarget.id);
      setSuccessMsg(`Collection "${deleteTarget.name}" deleted. Products remain safe.`);
      setDeleteTarget(null);
      await loadCollections();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete collection.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      await api.admin.seedCollections();
      setSuccessMsg('Default collections seeded successfully.');
      await loadCollections();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to seed collections.');
    } finally {
      setLoading(false);
    }
  };

  // Filter collections by search query & status filter
  const filteredCollections = collections.filter((c) => {
    const q = query.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? c.isActive
        : !c.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-collections-page" style={{ paddingBottom: '30px' }}>
      {/* Header Section */}
      <div
        className="admin-header-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <span className="eyebrow" style={{ color: 'var(--accent, #a3845b)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Catalog Architecture
          </span>
          <h1 className="serif" style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>
            Manage Collections
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          <button
            onClick={handleSeedDefaults}
            className="button secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '44px',
              padding: '0 14px',
              fontSize: '0.85rem',
              borderRadius: '6px',
            }}
          >
            <Sparkles size={16} /> Seed Defaults
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '44px',
              padding: '0 16px',
              fontSize: '0.88rem',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            <Plus size={18} /> Create Collection
          </button>
        </div>
      </div>

      {/* Filters Bar - Mobile First Touch Friendly */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search collection name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              minHeight: '44px',
              paddingLeft: '38px',
              paddingRight: '12px',
              fontSize: '15px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#9ca3af' }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          style={{
            width: '100%',
            minHeight: '44px',
            fontSize: '15px',
            padding: '0 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: '#fff',
          }}
        >
          <option value="ALL">All Statuses ({collections.length})</option>
          <option value="ACTIVE">Active Only ({collections.filter((c) => c.isActive).length})</option>
          <option value="INACTIVE">Inactive Only ({collections.filter((c) => !c.isActive).length})</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px', color: 'var(--accent, #6b5840)' }} />
          <p style={{ fontSize: '14px' }}>Loading collections catalog...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Layers size={40} style={{ color: '#d1d5db' }} />
          <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>No collections found matching your filters.</p>
          <button onClick={handleOpenCreateModal} className="button" style={{ minHeight: '44px', padding: '0 20px', marginTop: '6px' }}>
            <Plus size={16} /> Create New Collection
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (< 768px) */}
          <div className="collections-mobile-cards" style={{ display: 'grid', gap: '12px' }}>
            {filteredCollections.map((col) => (
              <div
                key={col.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '14px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Top Row: Thumbnail + Info + Active Pill */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                  {col.image ? (
                    <img
                      src={col.image}
                      alt={col.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#9ca3af',
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={22} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h3 className="serif" style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#111827', lineHeight: 1.3 }}>
                        {col.name}
                      </h3>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(col)}
                        aria-label={`Toggle active state for ${col.name}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '44px',
                          padding: '6px 14px',
                          borderRadius: '22px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: col.isActive ? '#dcfce7' : '#f3f4f6',
                          color: col.isActive ? '#15803d' : '#6b7280',
                          flexShrink: 0,
                        }}
                      >
                        {col.isActive ? <CheckCircle size={15} /> : <XCircle size={15} />}
                        {col.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#4b5563', wordBreak: 'break-all' }}>
                        /collections/{col.slug}
                      </code>
                    </div>
                  </div>
                </div>

                {col.description && (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {col.description}
                  </p>
                )}

                {/* Details Row: Products Linked */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#fafaf9',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#4b5563',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Package size={14} style={{ color: 'var(--accent, #6b5840)' }} />
                    {col.productCount ?? 0} {col.productCount === 1 ? 'product linked' : 'products linked'}
                  </span>
                  <span>Sort order: {col.sortOrder}</span>
                </div>

                {/* Touch Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEditModal(col)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minHeight: '44px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #d4af37',
                      background: '#fdfbf7',
                      color: 'var(--accent, #6b5840)',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit size={15} /> Edit
                  </button>

                  <button
                    onClick={() => setDeleteTarget(col)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minHeight: '44px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #fca5a5',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (>= 768px via media query) */}
          <div className="collections-desktop-table table-responsive border rounded bg-white" style={{ marginTop: '20px' }}>
            <table className="w-full text-sm text-left" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee', background: '#fafaf7' }}>
                  <th style={{ padding: '14px 16px', width: '65px' }}>Cover</th>
                  <th style={{ padding: '14px 16px' }}>Collection Name</th>
                  <th style={{ padding: '14px 16px' }}>URL Slug</th>
                  <th style={{ padding: '14px 16px' }}>Products Linked</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((col) => (
                  <tr key={col.id} style={{ borderBottom: '1px solid #f7f6f2' }}>
                    <td style={{ padding: '10px 16px' }}>
                      {col.image ? (
                        <img
                          src={col.image}
                          alt={col.name}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#9ca3af',
                          }}
                        >
                          <Layers size={18} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{col.name}</div>
                      {col.description && (
                        <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {col.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#374151' }}>
                        /collections/{col.slug}
                      </code>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 600, color: col.productCount ? '#111827' : '#9ca3af' }}>
                        {col.productCount ?? 0} {col.productCount === 1 ? 'product' : 'products'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(col)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: col.isActive ? '#dcfce7' : '#f3f4f6',
                          color: col.isActive ? '#15803d' : '#6b7280',
                        }}
                      >
                        {col.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {col.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '16px', padding: '10px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          onClick={() => handleOpenEditModal(col)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent, #6b5840)', fontWeight: 600 }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(col)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CREATE / EDIT COLLECTION MOBILE SHEET & DESKTOP DIALOG */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end', // Bottom sheet on mobile
            zIndex: 100,
            WebkitOverflowScrolling: 'touch',
          }}
          className="admin-modal-overlay"
        >
          <div
            className="admin-modal-sheet"
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '92vh',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Handle Bar on Mobile */}
            <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '2px', margin: '8px auto 4px auto', flexShrink: 0 }} />

            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
              }}
            >
              <h2 className="serif" style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: '#111827' }}>
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#4b5563',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 20px 40px 20px',
                  display: 'grid',
                  gap: '16px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nose Pin, Hip Chain, Earrings"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px', // 16px avoids iOS Safari auto-zoom
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nose-pin"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontFamily: 'monospace',
                      fontSize: '15px',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    Storefront URL: /collections/{formData.slug || 'slug'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short editorial description shown on collection banner..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '15px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                    Cover Image (Cloudflare R2)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://... or upload image"
                      value={formData.image}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                      }}
                    />

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        minHeight: '46px',
                        background: '#f3f4f6',
                        border: '1px dashed #9ca3af',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                        cursor: uploadingImage ? 'wait' : 'pointer',
                      }}
                    >
                      {uploadingImage ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      {uploadingImage ? 'Uploading image to Cloudflare R2...' : 'Select & Upload Image File'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {formData.image && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={formData.image}
                        alt="Preview"
                        style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Image Ready ✓</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '15px',
                      }}
                    />
                  </div>

                  <div style={{ paddingTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent, #6b5840)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Active Status</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div
                style={{
                  padding: '14px 20px',
                  background: '#ffffff',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '10px',
                  flexShrink: 0,
                  paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button secondary"
                  style={{ flex: 1, minHeight: '46px', fontSize: '15px', borderRadius: '8px' }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button"
                  style={{
                    flex: 2,
                    minHeight: '46px',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  disabled={saving}
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {saving ? 'Saving...' : editingCollection ? 'Update Collection' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MOBILE SHEET / DIALOG */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 110,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '24px 20px',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '50%', color: '#dc2626', flexShrink: 0 }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="serif" style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: '#111827' }}>
                  Delete Collection "{deleteTarget.name}"?
                </h3>
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '6px', lineHeight: 1.4 }}>
                  This collection currently has <strong>{deleteTarget.productCount ?? 0} product(s)</strong> assigned to it.
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#fffbebfb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                color: '#92400e',
                lineHeight: 1.4,
                marginBottom: '20px',
              }}
            >
              <strong>Safe Unlinking Guarantee:</strong> Deleting this collection safely removes the collection association from all assigned products. <strong>No products will be deleted.</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="button secondary"
                style={{ flex: 1, minHeight: '46px', fontSize: '15px', borderRadius: '8px' }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  flex: 1.5,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  minHeight: '46px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: deleting ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {deleting && <Loader2 className="animate-spin" size={16} />}
                {deleting ? 'Deleting...' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Responsive Viewport Styles */}
      <style jsx global>{`
        @media (max-width: 767px) {
          .collections-desktop-table {
            display: none !important;
          }
          .collections-mobile-cards {
            display: grid !important;
          }
        }
        @media (min-width: 768px) {
          .collections-mobile-cards {
            display: none !important;
          }
          .collections-desktop-table {
            display: block !important;
          }
          .admin-modal-overlay {
            align-items: center !important;
          }
          .admin-modal-sheet {
            border-radius: 12px !important;
            max-height: 85vh !important;
          }
        }
      `}</style>
    </div>
  );
}
