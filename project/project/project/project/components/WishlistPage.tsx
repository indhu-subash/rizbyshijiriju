'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from './StoreProvider';
import { products as fallbackProducts, Product } from '@/data/products';
import { ProductGrid } from './ProductCard';
import { api } from '@/lib/api';

export function WishlistPage() {
  const { wishlist, wishlistProducts = [] } = useStore();
  const [allProducts, setAllProducts] = useState<Product[]>(wishlistProducts);
  const [loading, setLoading] = useState(false);

  // Fetch full live product catalog from API to ensure matching database UUIDs
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.products
      .list()
      .then((res) => {
        if (isMounted && res && Array.isArray(res.products)) {
          setAllProducts(res.products);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch products for wishlist from API, using fallback:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve wishlist items from:
  // 1. Locally cached wishlistProducts
  // 2. Freshly fetched API products
  // 3. Fallback static products
  const combinedCatalog: Product[] = [
    ...wishlistProducts,
    ...allProducts,
    ...fallbackProducts,
  ];

  // Deduplicate and filter by wishlist IDs
  const items: Product[] = [];
  const seenIds = new Set<string>();

  for (const id of wishlist) {
    if (seenIds.has(id)) continue;
    const match = combinedCatalog.find(
      (p) => p.id === id || p.slug === id || (p.name && id && p.name.trim().toLowerCase() === id.trim().toLowerCase())
    );
    if (match && !seenIds.has(match.id)) {
      items.push(match);
      seenIds.add(match.id);
      seenIds.add(id);
    }
  }

  return (
    <main>
      <div className="page-intro container">
        <span className="eyebrow">Saved for later</span>
        <h1 className="serif">Your wishlist</h1>
        <p>Pieces you’re thinking about.</p>
      </div>
      <section className="section container">
        {items.length > 0 ? (
          <ProductGrid items={items} />
        ) : loading && wishlist.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <p>Loading your saved pieces...</p>
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={26} strokeWidth={1} />
            <h2 className="serif">Nothing saved yet.</h2>
            <p>Tap the heart on a piece you love and find it here.</p>
            <Link href="/shop" className="button">
              Explore jewellery
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
