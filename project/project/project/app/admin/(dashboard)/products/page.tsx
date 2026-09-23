'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Filter, Sparkles } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category: string;
  collection: string;
  price: number;
  stock: number;
  images: string[];
  isActive: boolean;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [collection, setCollection] = useState('');

  // Live Stock Editing & Polling State
  const [stockSaving, setStockSaving] = useState<{ [id: string]: boolean }>({});
  const [stockSaved, setStockSaved] = useState<{ [id: string]: boolean }>({});
  const [editingStock, setEditingStock] = useState<{ [id: string]: string }>({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [category, collection]);

  // Auto-refresh polling effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Only refresh if user is not actively editing a stock input
      if (Object.keys(editingStock).length === 0 && Object.values(stockSaving).every((v) => !v)) {
        loadProducts(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, editingStock, stockSaving]);

  const loadProducts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const res = await api.admin.getProducts({ category, collection });
      setProducts(res.products || []);
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'Failed to load products list.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleStockChange = (id: string, val: string) => {
    setEditingStock((prev) => ({ ...prev, [id]: val }));
  };

  const saveStock = async (id: string, currentStock: number) => {
    const inputVal = editingStock[id];
    if (inputVal === undefined) return;

    const newStock = parseInt(inputVal, 10);
    if (isNaN(newStock) || newStock < 0 || newStock === currentStock) {
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    if (stockSaving[id]) return; // Prevent overlapping saves

    setStockSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.admin.updateProductStock(id, newStock);
      const updatedStock = typeof res.stock === 'number' ? res.stock : newStock;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: updatedStock } : p)));
      setStockSaved((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setStockSaved((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update product stock.');
    } finally {
      setStockSaving((prev) => ({ ...prev, [id]: false }));
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const adjustStock = async (id: string, currentStock: number, delta: number) => {
    const targetStock = Math.max(0, currentStock + delta);
    if (targetStock === currentStock || stockSaving[id]) return;

    setStockSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.admin.updateProductStock(id, targetStock);
      const updatedStock = typeof res.stock === 'number' ? res.stock : targetStock;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: updatedStock } : p)));
      setStockSaved((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setStockSaved((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update product stock.');
    } finally {
      setStockSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const handleSeedProducts = async () => {
    setSeeding(true);
    setError('');
    setSeedMessage('');
    try {
      const res = await api.admin.seedProducts();
      setSeedMessage(res.message || 'Default catalog seeded successfully!');
      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to seed products catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product? It will no longer show up in the shop.')) return;
    try {
      await api.admin.deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate product.');
    }
  };

  // Filter products by search query client-side
  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.collection.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow">Inventory</span>
          <h1 className="serif text-3xl font-semibold">Manage Products</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`button ${autoRefresh ? 'secondary' : 'outline'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              background: autoRefresh ? '#e6f4ea' : 'transparent',
              borderColor: autoRefresh ? '#334c3d' : '#ccc',
              color: autoRefresh ? '#334c3d' : '#555',
            }}
          >
            {autoRefresh ? '🟢 Live Sync On (5s)' : '⚪ Live Sync Off'}
          </button>
          <button
            onClick={handleSeedProducts}
            disabled={seeding}
            className="button secondary flex items-center gap-2"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={16} /> {seeding ? 'Seeding Catalog...' : 'Seed Defaults'}
          </button>
          <Link href="/admin/products/new" className="button flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Product
          </Link>
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
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '35px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#888' }} />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Earrings">Earrings</option>
          <option value="Rings">Rings</option>
          <option value="Necklaces">Necklaces</option>
          <option value="Bracelets">Bracelets</option>
          <option value="Chains">Chains</option>
          <option value="Nose Pins">Nose Pins</option>
          <option value="Second Studs">Second Studs</option>
          <option value="Anklets">Anklets</option>
          <option value="Jewellery Sets">Jewellery Sets</option>
          <option value="Kids Jewellery">Kids Jewellery</option>
          <option value="Hair Accessories">Hair Accessories</option>
        </select>

        <select value={collection} onChange={(e) => setCollection(e.target.value)}>
          <option value="">All Collections</option>
          <option value="Anti-Tarnish">Anti-Tarnish</option>
          <option value="Traditional">Traditional</option>
          <option value="Bridal">Bridal</option>
          <option value="Men's">Men's</option>
          <option value="Kids">Kids</option>
          <option value="Hair Accessories">Hair Accessories</option>
          <option value="Silver Replica">Silver Replica</option>
          <option value="Diamond Replica">Diamond Replica</option>
          <option value="AD Collections">AD Collections</option>
          <option value="Fancy">Fancy</option>
          <option value="Gold Covering & Micro Plated">Gold Covering & Micro Plated</option>
          <option value="RIZ House of Fashion">RIZ House of Fashion</option>
        </select>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}
      {seedMessage && <div className="success-banner mb-6">{seedMessage}</div>}

      {/* Table */}
      {loading ? (
        <p className="muted text-center py-10">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p className="muted">No products found matching your filters.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={handleSeedProducts}
              disabled={seeding}
              className="button secondary flex items-center gap-2"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={15} /> {seeding ? 'Seeding Products...' : 'Seed Default Catalog'}
            </button>
            <Link href="/admin/products/new" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> Add New Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-responsive border rounded bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b" style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '16px' }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Collection</th>
                <th>Price</th>
                <th style={{ width: '190px' }}>Live Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f6f2' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '45px',
                          height: '45px',
                          background: '#eee',
                          borderRadius: '4px',
                        }}
                      />
                    )}
                  </td>
                  <td className="serif font-semibold">{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.collection}</td>
                  <td>₹{p.price}</td>
                  <td style={{ width: '190px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          disabled={p.stock <= 0 || stockSaving[p.id]}
                          onClick={() => adjustStock(p.id, p.stock, -1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            background: '#f8f8f8',
                            fontWeight: 'bold',
                            cursor: p.stock <= 0 || stockSaving[p.id] ? 'not-allowed' : 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            lineHeight: 1,
                            fontSize: '0.9rem',
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          disabled={stockSaving[p.id]}
                          value={editingStock[p.id] !== undefined ? editingStock[p.id] : p.stock}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveStock(p.id, p.stock);
                          }}
                          onBlur={() => saveStock(p.id, p.stock)}
                          style={{
                            width: '56px',
                            padding: '3px 4px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            border: stockSaving[p.id] ? '1.5px solid #3b82f6' : '1px solid #ccc',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                          }}
                        />
                        <button
                          type="button"
                          disabled={stockSaving[p.id]}
                          onClick={() => adjustStock(p.id, p.stock, 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            background: '#f8f8f8',
                            fontWeight: 'bold',
                            cursor: stockSaving[p.id] ? 'not-allowed' : 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            lineHeight: 1,
                            fontSize: '0.9rem',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', minHeight: '14px' }}>
                        {stockSaving[p.id] ? (
                          <span style={{ color: '#3b82f6', fontWeight: 600 }}>Saving...</span>
                        ) : stockSaved[p.id] ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Saved ✓</span>
                        ) : p.stock === 0 ? (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>Out of Stock</span>
                        ) : p.stock <= 3 ? (
                          <span style={{ color: '#d97706', fontWeight: 600 }}>Low Stock ({p.stock})</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag ${p.isActive ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                      {p.isActive ? 'Active' : 'Deactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div className="flex justify-end gap-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <Link href={`/admin/products/edit/${p.id}`} className="text-link flex items-center gap-1">
                        <Edit size={14} /> Edit
                      </Link>
                      {p.isActive && (
                        <button className="text-red-500 hover:text-red-700 flex items-center gap-1" onClick={() => handleDeactivate(p.id)}>
                          <Trash2 size={14} /> Deactivate
                        </button>
                      )}
                    </div>
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
