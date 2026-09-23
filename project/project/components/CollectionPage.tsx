'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProductGrid } from './ProductCard';
import { products as localProducts } from '@/data/products';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function CollectionPage({
  title,
  description,
  image,
  category,
  collection,
  items: initialItems,
}: {
  title: string;
  description: string;
  image: string;
  category?: string;
  collection?: string;
  items?: any[];
}) {
  const [fetchedItems, setFetchedItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialItems || initialItems.length === 0);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setFetchedItems(initialItems);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const targetCategory = category || (title.toLowerCase() !== 'new arrivals' && title.toLowerCase() !== 'best sellers' && !collection ? title : undefined);
    const targetCollection = collection || (title.toLowerCase() === 'new arrivals' ? 'New Arrivals' : title.toLowerCase() === 'best sellers' ? 'Best Sellers' : undefined);

    api.products
      .list({
        category: targetCategory,
        collection: targetCollection,
        sort: targetCollection === 'New Arrivals' ? 'Newest' : targetCollection === 'Best Sellers' ? 'Best Selling' : undefined,
      })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.products) && res.products.length > 0) {
            setFetchedItems(res.products);
          } else {
            setFetchedItems(null);
          }
        }
      })
      .catch((err) => {
        console.warn('API fetch failed for CollectionPage, using fallback:', err);
        if (isMounted) {
          setFetchedItems(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialItems, title, category, collection]);

  const fallbackFilter = (p: typeof localProducts[number]) => {
    if (category) {
      const c = category.toLowerCase().trim();
      const pCat = (p.category || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      return pCat.includes(c) || pName.includes(c);
    }
    if (collection) {
      const col = collection.toLowerCase().trim();
      const pCol = (p.collection || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      if (col.includes('new')) return Boolean(p.newArrival);
      if (col.includes('best')) return Boolean(p.bestseller);
      return pCol.includes(col) || pName.includes(col);
    }
    return true;
  };

  const displayItems =
    fetchedItems && fetchedItems.length > 0
      ? fetchedItems
      : localProducts.filter(fallbackFilter);

  return (
    <main>
      <div className="collection-hero">
        <Image src={image} alt={title} fill sizes="100vw" priority />
        <div className="collection-overlay" />
        <div className="container collection-heading">
          <span className="eyebrow">Riz by Shijiriju</span>
          <h1 className="serif">{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">The edit</span>
            <h2>Shop the collection</h2>
          </div>
          <span className="muted">{loading ? '...' : `${displayItems.length} pieces`}</span>
        </div>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Loader2 size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <ProductGrid items={displayItems} />
        )}
      </section>
    </main>
  );
}
