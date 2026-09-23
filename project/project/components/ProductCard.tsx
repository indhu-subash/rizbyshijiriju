'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, Check, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { useStore } from './StoreProvider';

const DEFAULT_FALLBACK_IMAGE = 'https://images.pexels.com/photos/29502969/pexels-photo-29502969.jpeg?auto=compress&cs=tinysrgb&w=900';

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist, addToCart } = useStore();
  const [isAdded, setIsAdded] = useState(false);

  const primarySrc = product.images && product.images[0] ? product.images[0] : DEFAULT_FALLBACK_IMAGE;
  const secondarySrc = product.images && product.images.length > 1 ? product.images[1] : null;

  const [mainImg, setMainImg] = useState<string>(primarySrc);
  const [secImg, setSecImg] = useState<string | null>(secondarySrc);

  const sale = product.originalPrice && Math.round((1 - product.price / product.originalPrice) * 100);
  const limited = product.tags && product.tags.includes('limited');
  const hasSecondaryImage = Boolean(secImg);
  const isWishlisted = wishlist.includes(product.id);

  const reviewCount = product.reviewCount || product.reviews || 0;
  const ratingValue = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 4.5;
  const productSlug = product.slug || product.id || encodeURIComponent(product.name);

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
        <Link href={`/product/${productSlug}`}>
          <Image
            src={mainImg}
            alt={product.name || 'Jewellery product'}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
            className={`primary-img ${hasSecondaryImage ? 'has-secondary' : ''}`}
            onError={() => setMainImg(DEFAULT_FALLBACK_IMAGE)}
          />
          {hasSecondaryImage && secImg && (
            <Image
              src={secImg}
              alt={`${product.name || 'Jewellery'} alternate view`}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 25vw"
              className="secondary-img"
              onError={() => setSecImg(null)}
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
          <Star size={12} fill="currentColor" /> {ratingValue.toFixed(1)}
          {reviewCount > 0 && <span>({reviewCount})</span>}
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
