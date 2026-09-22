'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, Check, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from './StoreProvider';

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist, addToCart } = useStore();
  const [isAdded, setIsAdded] = useState(false);

  const sale = product.originalPrice && Math.round((1 - product.price / product.originalPrice) * 100);
  const limited = product.tags.includes('limited');
  const hasSecondaryImage = product.images && product.images.length > 1;
  const isWishlisted = wishlist.includes(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.stock || isAdded) return;

    addToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
            className={`primary-img ${hasSecondaryImage ? 'has-secondary' : ''}`}
          />
          {hasSecondaryImage && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
              className="secondary-img"
            />
          )}
        </Link>

        {product.newArrival && <span className="product-badge">NEW</span>}
        {!product.newArrival && product.bestseller && <span className="product-badge">BESTSELLER</span>}
        {sale && <span className="product-badge sale">SALE</span>}
        {limited && product.stock > 0 && product.stock < 4 && <span className="product-badge limited">LIMITED</span>}

        <button
          className={`wishlist ${isWishlisted ? 'active' : ''}`}
          aria-label="Add to wishlist"
          onClick={() => toggleWishlist(product.id, product)}
        >
          <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <button
          className={`quick-add ${isAdded ? 'added' : ''}`}
          onClick={handleQuickAdd}
          disabled={!product.stock}
        >
          {isAdded ? (
            <>
              <Check size={14} /> Added ✓
            </>
          ) : product.stock ? (
            <>
              <Plus size={15} /> Quick add
            </>
          ) : (
            'Sold out'
          )}
        </button>
      </div>

      <Link href={`/product/${product.slug}`} className="product-info">
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
          <Star size={12} fill="currentColor" /> {product.rating} <span>({product.reviewCount})</span>
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
