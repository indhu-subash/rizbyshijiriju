'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from './StoreProvider';

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/36823005/pexels-photo-36823005.jpeg?auto=compress&cs=tinysrgb&w=900';

export function getValidImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_IMAGE;
  }
  const trimmed = url.trim();
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

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist, addToCart } = useStore();
  const sale = product.originalPrice && Math.round((1 - product.price / product.originalPrice) * 100);
  const limited = Array.isArray(product.tags) && product.tags.includes('limited');
  const productSlug = product.slug || product.id || encodeURIComponent(product.name);

  const rawImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined;
  const imageUrl = getValidImageUrl(rawImage);

  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/product/${productSlug}`}>
          <Image
            src={imageUrl}
            alt={product.name || 'Product Image'}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
          />
        </Link>
        {product.newArrival && <span className="product-badge">NEW</span>}
        {!product.newArrival && product.bestseller && <span className="product-badge">BESTSELLER</span>}
        {sale && <span className="product-badge sale">SALE</span>}
        {limited && product.stock > 0 && product.stock < 4 && <span className="product-badge limited">LIMITED</span>}
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
          disabled={!product.stock}
        >
          <Plus size={15} /> {product.stock ? 'Quick add' : 'Sold out'}
        </button>
      </div>
      <Link href={`/product/${productSlug}`} className="product-info">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        <div className="product-meta">
          <span>₹{(product.price || 0).toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <>
              <del>₹{(product.originalPrice || 0).toLocaleString('en-IN')}</del>
              <em>{sale}% off</em>
            </>
          )}
        </div>
        <div className="rating">
          <Star size={12} fill="currentColor" /> {product.rating || 5} <span>({product.reviewCount || 0})</span>
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
