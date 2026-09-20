'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

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

  useEffect(() => {
    loadProducts();
  }, [category, collection]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.list({ category, collection });
      if (res && Array.isArray(res.products)) {
        setProducts(res.products);
      } else {
        setProducts([]);
        if (res?.error) setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products list.');
      setProducts([]);
    } finally {
      setLoading(false);
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
  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const q = query.toLowerCase();
    const nameStr = (p.name || '').toLowerCase();
    const catStr = (p.category || '').toLowerCase();
    const colStr = (p.collection || '').toLowerCase();
    return nameStr.includes(q) || catStr.includes(q) || colStr.includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow">Inventory</span>
          <h1 className="serif text-3xl font-semibold">Manage Products</h1>
        </div>
        <Link href="/admin/products/new" className="button flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Product
        </Link>
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

      {/* Table */}
      {loading ? (
        <p className="muted text-center py-10">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded bg-white">
          <p className="muted">No products found matching your filters.</p>
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
                <th>Stock</th>
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
                  <td>
                    <span className={p.stock === 0 ? 'text-red-500 font-bold' : p.stock <= 3 ? 'text-amber-600 font-bold' : ''}>
                      {p.stock}
                    </span>
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
