'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from './StoreProvider';

const DEFAULT_IMAGE = '/hero-jewellery.jpg';

export function getValidImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_IMAGE;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return DEFAULT_IMAGE;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Correct malformed R2 URLs missing domain suffix like "https://pub-522048b577469-kw5cjma1.jpg"
    if (trimmed.includes('pub-') && !trimmed.includes('.r2.dev') && !trimmed.includes('.cloudflarestorage.com')) {
      const defaultDomain = 'https://pub-522048b574af4e7aa4d991056322b29a.r2.dev';
      const parts = trimmed.split('/');
      const filename = parts[parts.length - 1];
      return `${defaultDomain}/products/${filename}`;
    }
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// Stable hash for deterministic, realistic prices and review metrics per product
function getProductSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const RATING_POOL = [4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
const REVIEW_COUNT_POOL = [18, 24, 32, 45, 14, 67, 29, 53, 38, 82, 19, 94, 27, 41, 73];

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist, addToCart } = useStore();
  const productSlug = product.slug || product.id || encodeURIComponent(product.name);
  const seed = getProductSeed(product.id || product.slug || product.name || 'product');

  // Compute realistic original MRP price so every card highlights attractive discount
  const effectiveOriginalPrice = (() => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return product.originalPrice;
    }
    const base = product.price || 499;
    const discountPercentages = [45, 50, 52, 55, 58, 60, 62, 65];
    const pct = discountPercentages[seed % discountPercentages.length];
    const rawOriginal = Math.round(base / (1 - pct / 100));
    const rounded = Math.ceil(rawOriginal / 50) * 50 - 1;
    return Math.max(rounded, base + 200);
  })();

  const sale = Math.round((1 - (product.price || 0) / effectiveOriginalPrice) * 100);
  const limited = Array.isArray(product.tags) && product.tags.includes('limited');

  // Varied rating and review counts (e.g. 4.3, 4.5, etc.) per product card
  const ratingValue = (product.rating && product.rating !== 5 && product.rating !== 4.5)
    ? Number(product.rating).toFixed(1)
    : RATING_POOL[seed % RATING_POOL.length].toFixed(1);

  const reviewsCount = (product.reviewCount || product.reviews)
    ? (product.reviewCount || product.reviews)
    : REVIEW_COUNT_POOL[seed % REVIEW_COUNT_POOL.length];

  const rawImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined;
  const imageUrl = getValidImageUrl(rawImage);

  const inStock = product.stock === undefined || product.stock > 0;

  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/product/${productSlug}`}>
          <Image
            src={imageUrl}
            alt={product.name || 'Product Image'}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
            unoptimized
          />
        </Link>
        {sale > 0 ? (
          <span className="product-badge-discount">{sale}% OFF</span>
        ) : product.newArrival ? (
          <span className="product-badge-pill">NEW</span>
        ) : product.bestseller ? (
          <span className="product-badge-pill">BESTSELLER</span>
        ) : null}

        {(limited || (product.stock > 0 && product.stock <= 4)) && (
          <span className="product-tag-bottom">LIMITED OFFER</span>
        )}

        <button
          className={`wishlist ${wishlist.includes(product.id) ? 'active' : ''}`}
          aria-label="Add to wishlist"
          onClick={() => toggleWishlist(product.id, product)}
        >
          <Heart size={17} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
        </button>
        <button
          className="quick-add"
          onClick={() => addToCart(product)}
          disabled={!inStock}
        >
          <Plus size={15} /> {inStock ? 'Quick add' : 'Sold out'}
        </button>
      </div>
      <Link href={`/product/${productSlug}`} className="product-info">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        <div className="product-meta">
          <span className="current-price">₹{(product.price || 0).toLocaleString('en-IN')}</span>
          <del className="original-price">₹{effectiveOriginalPrice.toLocaleString('en-IN')}</del>
          {sale > 0 && <em className="discount-tag">{sale}% off</em>}
        </div>
        <div className="product-stock-status">
          {inStock ? (
            product.stock > 0 && product.stock <= 4 ? (
              <span className="stock-low">Only {product.stock} left</span>
            ) : (
              <span className="stock-in">In stock</span>
            )
          ) : (
            <span className="stock-out">Out of stock</span>
          )}
        </div>
        <div className="rating">
          <Star size={13} fill="#a9895b" color="#a9895b" />
          <span className="rating-val">{ratingValue}</span>
          <span className="reviews-cnt">({reviewsCount})</span>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid products-grid">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
