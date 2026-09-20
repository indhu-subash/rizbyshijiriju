'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Heart, Minus, Plus, Star, Truck, Share2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product, products } from '@/data/products';
import { useStore } from './StoreProvider';
import { ProductGrid } from './ProductCard';
import { api } from '@/lib/api';

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState<{ available?: boolean; estimate?: string; shippingCharge?: number; error?: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState('DETAILS');
  const { addToCart, toggleWishlist, wishlist } = useStore();

  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const hasColors = productColors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return productColors.length === 1 ? productColors[0] : '';
  });
  const [colorError, setColorError] = useState('');

  // Save to Recently Viewed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('riz_recently_viewed');
      let arr: string[] = stored ? JSON.parse(stored) : [];
      arr = arr.filter((id) => id !== product.id);
      arr.unshift(product.id);
      localStorage.setItem('riz_recently_viewed', JSON.stringify(arr.slice(0, 8)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [product.id]);

  function add(): boolean {
    if (product.stock <= 0) return false;
    if (hasColors && !selectedColor) {
      setColorError('Please select an available colour before adding to cart.');
      return false;
    }
    setColorError('');
    addToCart(product, qty, selectedColor || undefined);
    return true;
  }

  function handleBuyNow() {
    if (product.stock <= 0) return;
    const added = add();
    if (added) {
      router.push('/checkout');
    }
  }

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 6) {
      setPinResult({ error: 'Please enter a valid 6-digit pincode.' });
      return;
    }
    setPinLoading(true);
    setPinResult(null);

    try {
      const res = await api.orders.checkShipping(pin);
      setPinResult(res);
    } catch (err: any) {
      setPinResult({ error: err.message || 'Unable to check delivery.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stock status text & styling
  const stockBadge =
    product.stock > 5 ? (
      <span style={{ color: '#2e7d32', fontWeight: 600 }}>In stock</span>
    ) : product.stock > 0 ? (
      <span style={{ color: '#ed6c02', fontWeight: 600 }}>Low stock (Only {product.stock} left)</span>
    ) : (
      <span style={{ color: '#d32f2f', fontWeight: 600 }}>Out of stock</span>
    );

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <main>
      <div className="product-detail container">
        {/* Gallery */}
        <div className="gallery">
          <div className="gallery-main" style={{ position: 'relative' }}>
            <Image
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 55vw"
            />
          </div>
          {product.images.length > 1 && (
            <div className="thumbs">
              {product.images.map((image, i) => (
                <button
                  key={image}
                  className={activeImage === i ? 'active' : ''}
                  onClick={() => setActiveImage(i)}
                >
                  <Image src={image} alt={`${product.name} view ${i + 1}`} fill sizes="90px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy / Actions */}
        <div className="detail-copy">
          <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="eyebrow">{product.category}</span>
            <button
              onClick={handleShare}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#666' }}
            >
              {copied ? <Check size={16} color="#2e7d32" /> : <Share2 size={16} />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>

          <h1 className="serif">{product.name}</h1>

          <div className="detail-rating">
            <Star size={13} fill="currentColor" /> {product.rating} <span>· {product.reviews} reviews</span>
          </div>

          <div className="detail-price">
            ₹{(product.price || 0).toLocaleString('en-IN')}{' '}
            {product.originalPrice && (
              <>
                <del>₹{(product.originalPrice || 0).toLocaleString('en-IN')}</del>
                <em>Sale</em>
              </>
            )}
          </div>

          <p className="detail-description">{product.description}</p>

          <div className="detail-attributes">
            <span>
              <b>Material</b>
              {product.material}
            </span>
            <span>
              <b>Finish</b>
              {product.finish}
            </span>
            <span>
              <b>Availability</b>
              {stockBadge}
            </span>
          </div>

          {/* Available Colours Selector */}
          {hasColors && product.colors && product.colors.length > 0 && (
            <div className="product-color-selector" style={{ margin: '18px 0' }}>
              <span
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: '#334c3d',
                }}
              >
                AVAILABLE COLOURS
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.colors.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        setColorError('');
                      }}
                      style={{
                        padding: '8px 18px',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#334c3d' : '#4a4a4a',
                        backgroundColor: isSelected ? '#ede5db' : '#fcfbfa',
                        border: isSelected ? '1.5px solid #334c3d' : '1px solid #dcd4c9',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {selectedColor ? (
                <small style={{ display: 'block', marginTop: '8px', fontSize: '0.825rem', color: '#666' }}>
                  Selected: <b style={{ color: '#334c3d' }}>{selectedColor}</b>
                </small>
              ) : (
                <small style={{ display: 'block', marginTop: '8px', fontSize: '0.825rem', color: '#888' }}>
                  Please select a colour
                </small>
              )}
              {colorError && (
                <p style={{ color: '#d32f2f', fontSize: '0.825rem', marginTop: '6px', fontWeight: 500 }}>
                  {colorError}
                </p>
              )}
            </div>
          )}

          {/* Quantity & Wishlist */}
          <div className="quantity-row">
            <div className="quantity">
              <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock <= 0}>
                <Minus size={14} />
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock || 1, qty + 1))} disabled={product.stock <= 0 || qty >= product.stock}>
                <Plus size={14} />
              </button>
            </div>
            <button
              className={`wishlist-detail ${wishlist.includes(product.id) ? 'active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={17} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /> Wishlist
            </button>
          </div>

          {/* Action Buttons */}
          <button
            className="button add-button"
            disabled={product.stock <= 0}
            onClick={add}
          >
            {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
          </button>

          <button
            className="button secondary add-button"
            disabled={product.stock <= 0}
            onClick={handleBuyNow}
          >
            Buy now
          </button>

          {/* Delivery Check */}
          <div className="delivery-check">
            <div>
              <Truck size={18} />
              <span>
                Check delivery
                <br />
                <small>Free shipping over ₹999</small>
              </span>
            </div>
            <form onSubmit={handleCheckPincode}>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode"
              />
              <button type="submit" disabled={pinLoading}>
                {pinLoading ? 'Checking...' : 'Check'}
              </button>
            </form>
            {pinResult && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                {pinResult.error ? (
                  <p style={{ color: '#d32f2f' }}>{pinResult.error}</p>
                ) : (
                  <p style={{ color: '#2e7d32' }}>
                    Delivery available. {pinResult.estimate || '3–5 working days'}
                    {pinResult.shippingCharge !== undefined &&
                      (pinResult.shippingCharge === 0
                        ? ' (Free shipping)'
                        : ` (Shipping: ₹${pinResult.shippingCharge})`)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Accordions */}
          <div className="accordions">
            {['DETAILS', 'WILL IT TARNISH?', 'MATERIAL & CARE', 'SHIPPING & DELIVERY', 'RETURNS'].map((label) => (
              <div className="accordion" key={label}>
                <button onClick={() => setOpen(open === label ? '' : label)}>
                  {label}
                  <ChevronDown size={15} className={open === label ? 'rotate' : ''} />
                </button>
                {open === label && (
                  <p>
                    {label === 'DETAILS'
                      ? product.description
                      : label === 'WILL IT TARNISH?'
                      ? 'This piece has an anti-tarnish finish designed for everyday wear. Keep it dry and follow our care guide to help preserve its shine.'
                      : label === 'MATERIAL & CARE'
                      ? 'Keep your pieces dry, away from perfumes and lotions. Store separately in the Riz pouch and polish gently with a soft cloth.'
                      : label === 'SHIPPING & DELIVERY'
                      ? 'Free shipping on orders above ₹999. Orders are packed within 1–2 working days.'
                      : 'Easy 7-day returns on unused pieces in their original packaging.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Complete the look</span>
              <h2>You may also like</h2>
            </div>
          </div>
          <ProductGrid items={relatedProducts} />
        </section>
      )}
    </main>
  );
}
