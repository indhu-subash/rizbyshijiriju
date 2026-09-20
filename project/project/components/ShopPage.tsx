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

const colorOptions = [
  'Gold',
  'Silver',
  'Rose Gold',
  'Ruby Red',
  'Emerald Green',
  'Sapphire Blue',
  'Pearl White',
  'Black',
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
  const [colors, setColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('Featured');
  const [filterOpen, setFilterOpen] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep state synchronized with URL search parameter changes
  useEffect(() => {
    setCategory(initialCategory || '');
  }, [initialCategory]);

  useEffect(() => {
    setCollection(initialCollection || '');
  }, [initialCollection]);

  useEffect(() => {
    setQuery(initialQuery || '');
    setDebouncedQuery(initialQuery || '');
  }, [initialQuery]);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const toggleColor = (c: string) => {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  // Load products from Backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.products
      .list({
        category: category || undefined,
        collection: collection || undefined,
        color: colors.length > 0 ? colors.join(',') : undefined,
        query: debouncedQuery || undefined,
        priceRange: priceRange || undefined,
        sort: sort || undefined,
      })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.products) && res.products.length > 0) {
            setItems(res.products);
          } else {
            const matchesCategory = (p: any, cat: string) => {
              if (!cat) return true;
              const c = cat.toLowerCase().trim();
              const singular = c.endsWith('s') ? c.slice(0, -1) : c;
              const pCat = (p.category || '').toLowerCase();
              const pName = (p.name || '').toLowerCase();
              const pGender = (p.gender || '').toLowerCase();
              const pCollection = (p.collection || '').toLowerCase();
              const pTags = (p.tags || []).map((t: string) => t.toLowerCase());

              if (c.includes('anklet')) return pCat.includes('anklet') || pName.includes('anklet') || pTags.includes('anklets') || pTags.includes('anklet');
              if (c.includes('bangle')) return pCat.includes('bangle') || pCat.includes('bracelet') || pName.includes('bangle') || pTags.includes('bangles') || pTags.includes('bangle');
              if (c.includes('pendant')) return pCat.includes('pendant') || pCat.includes('necklace') || pName.includes('pendant') || pTags.includes('pendants') || pTags.includes('pendant');
              if (c.includes('hair')) return pCat.includes('hair') || pName.includes('hair') || pTags.includes('hair');
              if (c.includes('nose')) return pCat.includes('nose') || pName.includes('nose') || pTags.includes('nose');
              if (c.includes('stud')) return pCat.includes('stud') || pCat.includes('earring') || pName.includes('stud') || pTags.includes('studs');
              if (c.includes('men')) return pGender === 'men' || pCollection.includes('men') || pCat.includes('men') || pTags.includes('men');
              if (c.includes('kid')) return pGender === 'kids' || pCollection.includes('kids') || pCat.includes('kid') || pTags.includes('kids');

              return (
                pCat === c ||
                pCat.includes(c) ||
                pCat.includes(singular) ||
                pName.includes(c) ||
                pName.includes(singular) ||
                pTags.includes(c) ||
                pTags.includes(singular)
              );
            };

            const matchesCollection = (p: any, col: string) => {
              if (!col) return true;
              const c = col.toLowerCase().trim();
              const pCol = (p.collection || '').toLowerCase();
              const pName = (p.name || '').toLowerCase();
              const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
              return pCol === c || pCol.includes(c) || pName.includes(c) || pTags.includes(c);
            };

            const filteredFallback = fallbackProducts.filter((p) => {
              if (category && !matchesCategory(p, category)) return false;
              if (collection && !matchesCollection(p, collection)) return false;
              if (
                colors.length > 0 &&
                !colors.some((c) => p.colors?.some((pc: string) => pc.toLowerCase() === c.toLowerCase()))
              )
                return false;
              if (debouncedQuery) {
                const q = debouncedQuery.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchCat = p.category.toLowerCase().includes(q);
                const matchCol = p.collection.toLowerCase().includes(q);
                if (!matchName && !matchCat && !matchCol) return false;
              }
              return true;
            });
            setItems(filteredFallback.length > 0 ? filteredFallback : fallbackProducts);
          }
        }
      })
      .catch((err) => {
        console.error('API load products failed, using fallback:', err);
        if (isMounted) {
          const matchesCategory = (p: any, cat: string) => {
            if (!cat) return true;
            const c = cat.toLowerCase().trim();
            const singular = c.endsWith('s') ? c.slice(0, -1) : c;
            const pCat = (p.category || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pGender = (p.gender || '').toLowerCase();
            return pCat.includes(c) || pCat.includes(singular) || pName.includes(c) || pName.includes(singular) || (c.includes('men') && pGender === 'men') || (c.includes('kid') && pGender === 'kids');
          };
          const matchesCollection = (p: any, col: string) => {
            if (!col) return true;
            const c = col.toLowerCase().trim();
            const pCol = (p.collection || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            return pCol.includes(c) || pName.includes(c);
          };
          const filteredFallback = fallbackProducts.filter((p) => {
            if (category && !matchesCategory(p, category)) return false;
            if (collection && !matchesCollection(p, collection)) return false;
            return true;
          });
          setItems(filteredFallback.length > 0 ? filteredFallback : fallbackProducts);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, collection, colors, debouncedQuery, priceRange, sort]);

  // Client-side availability filter
  const displayedItems = useMemo(() => {
    if (!inStockOnly) return items;
    return items.filter((p) => p.stock > 0);
  }, [items, inStockOnly]);

  function clear() {
    setCategory('');
    setCollection('');
    setColors([]);
    setPriceRange('');
    setQuery('');
    setInStockOnly(false);
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (collection ? 1 : 0) +
    colors.length +
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

          {/* Color / Tone Filter */}
          <div className="filter-group">
            <h4>COLOR / TONE</h4>
            {colorOptions.map((c) => {
              const isChecked = colors.includes(c);
              return (
                <label
                  key={c}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '5px 0',
                    color: isChecked ? 'var(--brown)' : 'var(--muted)',
                    fontWeight: isChecked ? 600 : 400,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColor(c);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--sage)', cursor: 'pointer' }}
                  />
                  <span>{c}</span>
                </label>
              );
            })}
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
              {colors.map((c) => (
                <span key={c} className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Color: {c} <X size={12} onClick={() => toggleColor(c)} style={{ cursor: 'pointer' }} />
                </span>
              ))}
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
