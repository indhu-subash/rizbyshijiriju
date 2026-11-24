'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  'Watches',
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

const isStrictCategoryMatch = (productCategory: string, targetCategory: string) => {
  if (!targetCategory) return true;
  const target = targetCategory.trim().toLowerCase();
  const targetSingular = target.endsWith('s') ? target.slice(0, -1) : target;
  const targetPlural = target.endsWith('s') ? target : target + 's';

  const pCat = (productCategory || '').trim().toLowerCase();
  const pCatSingular = pCat.endsWith('s') ? pCat.slice(0, -1) : pCat;
  const pCatPlural = pCat.endsWith('s') ? pCat : pCat + 's';

  return (
    pCat === target ||
    pCat === targetSingular ||
    pCat === targetPlural ||
    pCatSingular === targetSingular ||
    pCatPlural === targetPlural
  );
};

export function ShopPage({
  initialCategory,
  initialCollection,
  initialQuery,
}: {
  initialCategory?: string;
  initialCollection?: string;
  initialQuery?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to read initial URL param safely
  const getParam = (key: string) => (searchParams ? searchParams.get(key) : null);

  const [category, setCategory] = useState<string>(() => {
    return getParam('category') || initialCategory || '';
  });
  const [collection, setCollection] = useState<string>(() => {
    return getParam('collection') || initialCollection || '';
  });
  const [query, setQuery] = useState<string>(() => {
    return getParam('query') || getParam('q') || initialQuery || '';
  });
  const [debouncedQuery, setDebouncedQuery] = useState<string>(() => {
    return getParam('query') || getParam('q') || initialQuery || '';
  });
  const [colors, setColors] = useState<string[]>(() => {
    const c = getParam('color') || getParam('colors') || '';
    return c ? c.split(',').map((s) => s.trim()).filter(Boolean) : [];
  });
  const [priceRange, setPriceRange] = useState<string>(() => {
    return getParam('priceRange') || getParam('price') || '';
  });
  const [inStockOnly, setInStockOnly] = useState<boolean>(() => {
    return getParam('inStock') === 'true' || getParam('availability') === 'in-stock';
  });
  const [sort, setSort] = useState<string>(() => {
    return getParam('sort') || 'Featured';
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep state synchronized with prop changes if passed directly
  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory || '');
  }, [initialCategory]);

  useEffect(() => {
    if (initialCollection !== undefined) setCollection(initialCollection || '');
  }, [initialCollection]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery || '');
      setDebouncedQuery(initialQuery || '');
    }
  }, [initialQuery]);

  // Sync state if searchParams change externally (e.g., QuickCategoryStrip or header links)
  useEffect(() => {
    if (!searchParams) return;
    const urlCategory = searchParams.get('category') || '';
    const urlCollection = searchParams.get('collection') || '';
    const urlQuery = searchParams.get('query') || searchParams.get('q') || '';
    const urlColorStr = searchParams.get('color') || searchParams.get('colors') || '';
    const urlColors = urlColorStr ? urlColorStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const urlPrice = searchParams.get('priceRange') || searchParams.get('price') || '';
    const urlInStock = searchParams.get('inStock') === 'true' || searchParams.get('availability') === 'in-stock';
    const urlSort = searchParams.get('sort') || 'Featured';

    setCategory((prev) => (prev !== urlCategory ? urlCategory : prev));
    setCollection((prev) => (prev !== urlCollection ? urlCollection : prev));
    setQuery((prev) => (prev !== urlQuery ? urlQuery : prev));
    setDebouncedQuery((prev) => (prev !== urlQuery ? urlQuery : prev));
    setColors((prev) => (prev.join(',') !== urlColors.join(',') ? urlColors : prev));
    setPriceRange((prev) => (prev !== urlPrice ? urlPrice : prev));
    setInStockOnly((prev) => (prev !== urlInStock ? urlInStock : prev));
    setSort((prev) => (prev !== urlSort ? urlSort : prev));
  }, [searchParams]);

  // Handle browser back and forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      setCategory(params.get('category') || '');
      setCollection(params.get('collection') || '');
      const c = params.get('color') || params.get('colors') || '';
      setColors(c ? c.split(',').map((s) => s.trim()).filter(Boolean) : []);
      setPriceRange(params.get('priceRange') || params.get('price') || '');
      setInStockOnly(params.get('inStock') === 'true' || params.get('availability') === 'in-stock');
      const q = params.get('query') || params.get('q') || '';
      setQuery(q);
      setDebouncedQuery(q);
      setSort(params.get('sort') || 'Featured');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Reflect all active filters onto the browser URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (collection) params.set('collection', collection);
    if (colors.length > 0) params.set('color', colors.join(','));
    if (priceRange) params.set('priceRange', priceRange);
    if (inStockOnly) params.set('inStock', 'true');
    if (debouncedQuery.trim()) params.set('query', debouncedQuery.trim());
    if (sort && sort !== 'Featured') params.set('sort', sort);

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Only update if URL actually differs from current location
    const currentQuery = window.location.search.replace(/^\?/, '');
    if (currentQuery !== queryString) {
      window.history.replaceState(null, '', targetUrl);
    }
  }, [category, collection, colors, priceRange, inStockOnly, debouncedQuery, sort, pathname]);

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
          if (res && Array.isArray(res.products)) {
            const strictFiltered = (category
              ? res.products.filter((p: any) => isStrictCategoryMatch(p.category, category))
              : res.products
            ).filter((p: any) => (p.stock ?? 0) > 0);
            setItems(strictFiltered);
          } else {
            setItems([]);
          }
        }
      })
      .catch((err) => {
        console.error('API load products failed, using fallback:', err);
        if (isMounted) {
          const matchesCollection = (p: any, col: string) => {
            if (!col) return true;
            const c = col.toLowerCase().trim();
            const pCol = (p.collection || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
            return pCol === c || pCol.includes(c) || pName.includes(c) || pTags.includes(c);
          };

          const filteredFallback = fallbackProducts.filter((p) => {
            if ((p.stock ?? 0) <= 0) return false;
            if (category && !isStrictCategoryMatch(p.category, category)) return false;
            if (collection && !matchesCollection(p, collection)) return false;
            return true;
          });
          setItems(filteredFallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, collection, colors, debouncedQuery, priceRange, sort]);

  // Exclude out of stock products from the store
  const displayedItems = useMemo(() => {
    return items.filter((p) => (p.stock ?? 0) > 0);
  }, [items]);

  function clear() {
    setCategory('');
    setCollection('');
    setColors([]);
    setPriceRange('');
    setQuery('');
    setDebouncedQuery('');
    setInStockOnly(false);
    setSort('Featured');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', pathname);
    }
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (collection ? 1 : 0) +
    colors.length +
    (priceRange ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (query ? 1 : 0) +
    (sort && sort !== 'Featured' ? 1 : 0);

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

            <span className="result-count">{displayedItems.length} {displayedItems.length === 1 ? 'piece' : 'pieces'}</span>

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
              {sort && sort !== 'Featured' && (
                <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--ivory)' }}>
                  Sort: {sort} <X size={12} onClick={() => setSort('Featured')} style={{ cursor: 'pointer' }} />
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
