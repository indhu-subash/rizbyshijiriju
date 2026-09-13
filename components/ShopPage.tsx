'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Loader2, Check } from 'lucide-react';
import { products as fallbackProducts } from '@/data/products';
import { ProductGrid } from './ProductCard';
import { api } from '@/lib/api';

const categories = [
  'Necklaces',
  'Earrings',
  'Rings',
  'Bangles',
  'Bracelets',
  'Pendants',
  'Anklets',
  'Nose Pins',
  'Chains',
  'Hair Accessories',
  'Jewellery Sets',
  "Men's Jewellery",
  'Kids Jewellery',
];

const collections = [
  'Anti-Tarnish',
  'Traditional',
  'Bridal',
  "Men's",
  'Kids',
  'Hair Accessories',
  'Silver Replica',
  'Diamond Replica',
  'AD Collections',
  'Fancy',
  'Gold Covering & Micro Plated',
  'RIZ House of Fashion',
];

const colorSwatches = [
  { name: 'Gold', hex: '#d4af37', border: '#b59325' },
  { name: 'Silver', hex: '#d0d5dd', border: '#98a2b3' },
  { name: 'Rose Gold', hex: '#e8b4b8', border: '#c48b91' },
  { name: 'Ruby Red', hex: '#9b111e', border: '#700b14' },
  { name: 'Emerald Green', hex: '#2e7d32', border: '#1b5e20' },
  { name: 'Sapphire Blue', hex: '#1565c0', border: '#0d47a1' },
  { name: 'Pearl White', hex: '#fdfbf7', border: '#d0c8b8' },
  { name: 'Black', hex: '#212529', border: '#000000' },
  { name: 'Multi-color', hex: 'linear-gradient(135deg, #d4af37, #e8b4b8, #2e7d32, #1565c0)', border: '#aa9050' },
];

const priceOptions = ['Under ₹500', '₹500–₹999', '₹1,000–₹1,999', '₹2,000+'];

export function ShopPage({
  initialCategory,
  initialCollection,
  initialQuery,
}: {
  initialCategory?: string;
  initialCollection?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery || '');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [collection, setCollection] = useState(initialCollection || '');
  const [color, setColor] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('Featured');
  const [filterOpen, setFilterOpen] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Load products from Backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.products
      .list({
        category: category || undefined,
        collection: collection || undefined,
        color: color || undefined,
        query: debouncedQuery || undefined,
        priceRange: priceRange || undefined,
        sort: sort || undefined,
      })
      .then((res) => {
        if (isMounted) {
          if (res && res.products) {
            setItems(res.products);
          } else {
            setItems(fallbackProducts);
          }
        }
      })
      .catch((err) => {
        console.error('API load products failed, using fallback:', err);
        if (isMounted) {
          setItems(fallbackProducts);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, collection, color, debouncedQuery, priceRange, sort]);

  // Client-side availability filter
  const displayedItems = useMemo(() => {
    if (!inStockOnly) return items;
    return items.filter((p) => p.stock > 0);
  }, [items, inStockOnly]);

  function clear() {
    setCategory('');
    setCollection('');
    setColor('');
    setPriceRange('');
    setQuery('');
    setInStockOnly(false);
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (collection ? 1 : 0) +
    (color ? 1 : 0) +
    (priceRange ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (query ? 1 : 0);

  return (
    <main>
      <div className="page-intro container">
        <span className="eyebrow">EDITORIAL SELECTION</span>
        <h1 className="serif">Shop All</h1>
        <p>Small details. Soft gold. Pieces made to live in.</p>
      </div>

      <section className="shop-layout container">
        {/* Filter Sidebar */}
        <aside className={`filter-sidebar ${filterOpen ? 'open' : ''}`}>
          <div className="filter-header">
            <strong>Filter by</strong>
            <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <button
              className={inStockOnly ? 'selected' : ''}
              onClick={() => setInStockOnly(!inStockOnly)}
            >
              In Stock Only {inStockOnly ? '✓' : ''}
            </button>
          </div>

          {/* Color Filter Swatches */}
          <div className="filter-group">
            <h4>Color / Tone</h4>
            <div className="color-swatch-grid">
              {colorSwatches.map((swatch) => {
                const isSelected = color === swatch.name;
                return (
                  <button
                    key={swatch.name}
                    title={swatch.name}
                    className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setColor(isSelected ? '' : swatch.name)}
                    style={{
                      background: swatch.hex,
                      borderColor: isSelected ? 'var(--brown)' : swatch.border,
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        color={swatch.name === 'Pearl White' || swatch.name === 'Silver' ? '#333' : '#fff'}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {color && (
              <div className="active-color-name">
                Selected: <strong>{color}</strong>
              </div>
            )}
          </div>

          <FilterGroup title="Category" options={categories} value={category} setValue={setCategory} />
          <FilterGroup title="Collection" options={collections} value={collection} setValue={setCollection} />
          <FilterGroup title="Price" options={priceOptions} value={priceRange} setValue={setPriceRange} />

          {activeFilterCount > 0 && (
            <button className="text-link clear" onClick={clear} style={{ marginTop: '20px' }}>
              Clear all filters ({activeFilterCount})
            </button>
          )}
        </aside>

        {filterOpen && <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />}

        {/* Results Area */}
        <div className="shop-results">
          <div className="shop-toolbar">
            <button className="filter-trigger" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            <div className="search-field">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jewellery..."
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <span className="result-count">{displayedItems.length} pieces</span>

            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
              <option value="Featured">Featured</option>
              <option value="Newest">Newest</option>
              <option value="Best Selling">Best Selling</option>
              <option value="Price Low to High">Price Low to High</option>
              <option value="Price High to Low">Price High to Low</option>
            </select>
          </div>

          {/* Active Filters Display Tags */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {category && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Category: {category} <X size={12} onClick={() => setCategory('')} style={{ cursor: 'pointer' }} />
                </span>
              )}
              {collection && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Collection: {collection} <X size={12} onClick={() => setCollection('')} style={{ cursor: 'pointer' }} />
                </span>
              )}
              {color && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Color: {color} <X size={12} onClick={() => setColor('')} style={{ cursor: 'pointer' }} />
                </span>
              )}
              {priceRange && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Price: {priceRange} <X size={12} onClick={() => setPriceRange('')} style={{ cursor: 'pointer' }} />
                </span>
              )}
              {inStockOnly && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  In Stock Only <X size={12} onClick={() => setInStockOnly(false)} style={{ cursor: 'pointer' }} />
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '90px 0', textAlign: 'center' }}>
              <Loader2 size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
              <p className="muted" style={{ marginTop: '16px', fontSize: '13px' }}>
                Curating pieces for you...
              </p>
            </div>
          ) : displayedItems.length > 0 ? (
            <ProductGrid items={displayedItems} />
          ) : (
            <div className="empty-state">
              <span className="eyebrow">NO MATCHES</span>
              <h2 className="serif">No pieces found.</h2>
              <p>Try a different search term or adjust your filters to view all products.</p>
              <button className="button" onClick={clear}>
                View all jewellery
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function FilterGroup({
  title,
  options,
  value,
  setValue,
}: {
  title: string;
  options: string[];
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="filter-group">
      <h4>{title}</h4>
      {options.map((option) => (
        <button
          className={value === option ? 'selected' : ''}
          key={option}
          onClick={() => setValue(value === option ? '' : option)}
        >
          {option} <span>{value === option ? '×' : ''}</span>
        </button>
      ))}
    </div>
  );
}
