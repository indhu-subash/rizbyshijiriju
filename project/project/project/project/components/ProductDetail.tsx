'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Heart,
  Minus,
  Plus,
  Star,
  Truck,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Lock,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product, products } from '@/data/products';
import { useStore } from './StoreProvider';
import { ProductGrid, getValidImageUrl } from './ProductCard';
import { api } from '@/lib/api';

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState<{
    available?: boolean;
    estimate?: string;
    shippingCharge?: number;
    error?: string;
  } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>('DETAILS');
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const { addToCart, toggleWishlist, wishlist } = useStore();

  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const hasColors = productColors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return productColors.length === 1 ? productColors[0] : '';
  });
  const [colorError, setColorError] = useState('');

  // Size management
  const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
  const isSizedProduct = product.productType === 'bangle' || product.productType === 'ring' || productSizes.length > 0;
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState('');

  const activeSizeStock = isSizedProduct
    ? (selectedSize ? (productSizes.find((s) => s.size === selectedSize)?.stock ?? 0) : 0)
    : product.stock;

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
    if (isSizedProduct) {
      if (!selectedSize) {
        setSizeError('Please select a size before adding to cart.');
        return false;
      }
      if (activeSizeStock <= 0) {
        setSizeError('Selected size is currently out of stock.');
        return false;
      }
    } else if (product.stock <= 0) {
      return false;
    }

    if (hasColors && !selectedColor) {
      setColorError('Please select an available colour before adding to cart.');
      return false;
    }

    setColorError('');
    setSizeError('');
    setIsAdding(true);

    addToCart(product, qty, selectedColor || undefined, selectedSize || undefined);

    setTimeout(() => {
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2200);
    }, 300);

    return true;
  }

  function handleBuyNow() {
    if (isSizedProduct && activeSizeStock <= 0 && selectedSize) return;
    if (!isSizedProduct && product.stock <= 0) return;
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

  // Calculate discount percentage if valid original price exists
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Stock status text & styling
  const stockBadge =
    product.stock > 5 ? (
      <span className="pdp-stock-badge in-stock">
        <span className="dot" /> In Stock — Ready to ship
      </span>
    ) : product.stock > 0 ? (
      <span className="pdp-stock-badge low-stock">
        <span className="dot" /> Low Stock (Only {product.stock} left)
      </span>
    ) : (
      <span className="pdp-stock-badge out-of-stock">
        <span className="dot" /> Sold Out
      </span>
    );

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Helper function for color swatch hex codes
  const getColorHex = (colorName: string) => {
    const lower = colorName.toLowerCase();
    if (lower.includes('rose')) return '#d8a499';
    if (lower.includes('gold')) return '#e5c158';
    if (lower.includes('silver')) return '#d1d5db';
    if (lower.includes('black')) return '#1a1a1a';
    if (lower.includes('white') || lower.includes('pearl')) return '#f8f9fa';
    return '#a9895b';
  };

  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="pdp-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/shop">Shop</Link>
          <span className="sep">/</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span className="sep">/</span>
          <span className="current">{product.name}</span>
        </nav>

        {/* Product Hero Section */}
        <div className="pdp-grid">
          {/* Gallery Column */}
          <div className="pdp-gallery">
            <div className="pdp-gallery-main">
              {/* Badges Overlay */}
              <div className="pdp-badges">
                <span className="pdp-badge highlight">ANTI-TARNISH</span>
                {product.newArrival && <span className="pdp-badge">NEW</span>}
                {!product.newArrival && product.bestseller && <span className="pdp-badge">BESTSELLER</span>}
                {discountPercent && <span className="pdp-badge sale">{discountPercent}% OFF</span>}
              </div>

              {/* Main Image */}
              <div
                className="pdp-main-image-wrap"
                onClick={() => setLightboxOpen(true)}
                title="Click to view full size"
              >
                <Image
                  src={getValidImageUrl(product.images[activeImage] || product.images[0])}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="pdp-main-img"
                />
                <button className="pdp-zoom-btn" aria-label="Expand image view">
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="pdp-thumbs">
                  {product.images.map((image, i) => (
                    <button
                      key={image + i}
                      className={`pdp-thumb-btn ${activeImage === i ? 'active' : ''}`}
                      onClick={() => setActiveImage(i)}
                      aria-label={`View product image ${i + 1}`}
                    >
                      <Image src={getValidImageUrl(image)} alt={`${product.name} thumbnail ${i + 1}`} fill sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details & Buy Box Column */}
          <div className="pdp-copy">
            {/* Header / Brand & Share */}
            <div className="pdp-header">
              <div className="pdp-brand-tag">
                <span>RIZ BY SHIJIRIJU</span>
                <span className="bullet">•</span>
                <span>{product.category.toUpperCase()}</span>
              </div>
              <button onClick={handleShare} className="pdp-share-btn">
                {copied ? <Check size={15} color="#2e7d32" /> : <Share2 size={15} />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </button>
            </div>

            <h1 className="pdp-title">{product.name}</h1>

            {/* Rating / Review */}
            <div className="pdp-rating-row">
              <div className="pdp-stars">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    size={14}
                    fill={idx < Math.floor(product.rating || 5) ? '#a9895b' : 'none'}
                    color="#a9895b"
                  />
                ))}
              </div>
              <span className="pdp-rating-text">
                <strong>{product.rating || 4.9}</strong> ({product.reviews || 12} Verified Reviews)
              </span>
            </div>

            {/* Price Box */}
            <div className="pdp-price-box">
              <span className="pdp-price">₹{(product.price || 0).toLocaleString('en-IN')}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <del className="pdp-original-price">₹{product.originalPrice.toLocaleString('en-IN')}</del>
                  <span className="pdp-save-badge">Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')} ({discountPercent}%)</span>
                </>
              )}
              <div className="pdp-tax-note">Inclusive of all taxes. Free express shipping on orders over ₹999</div>
            </div>

            {/* Short Description */}
            <p className="pdp-description">{product.description}</p>

            {/* Trust Highlights Bar */}
            <div className="pdp-trust-bar">
              <div className="pdp-trust-item">
                <Sparkles size={16} className="pdp-trust-icon" />
                <span>Anti-Tarnish & Waterproof</span>
              </div>
              <div className="pdp-trust-item">
                <ShieldCheck size={16} className="pdp-trust-icon" />
                <span>Hypoallergenic Steel</span>
              </div>
              <div className="pdp-trust-item">
                <RotateCcw size={16} className="pdp-trust-icon" />
                <span>7-Day Easy Returns</span>
              </div>
              <div className="pdp-trust-item">
                <Lock size={16} className="pdp-trust-icon" />
                <span>100% Secure Checkout</span>
              </div>
            </div>

            {/* Colour Selector Swatches */}
            {hasColors && product.colors && product.colors.length > 0 && (
              <div className="pdp-color-section">
                <div className="pdp-color-head">
                  <span className="pdp-label">SELECT COLOUR</span>
                  <span className="pdp-selected-color">
                    {selectedColor ? <strong>{selectedColor}</strong> : <em style={{ color: '#d32f2f' }}>Please select</em>}
                  </span>
                </div>

                <div className="pdp-swatches">
                  {product.colors.map((c) => {
                    const isSelected = selectedColor === c;
                    const hexColor = getColorHex(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        className={`pdp-swatch-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedColor(c);
                          setColorError('');
                        }}
                        aria-label={`Select ${c} colour`}
                      >
                        <span className="pdp-swatch-circle" style={{ backgroundColor: hexColor }} />
                        <span className="pdp-swatch-name">{c}</span>
                        {isSelected && <Check size={13} className="pdp-swatch-check" />}
                      </button>
                    );
                  })}
                </div>

                {colorError && <p className="pdp-error-msg">{colorError}</p>}
              </div>
            )}

            {/* Size Selector Section */}
            {isSizedProduct && (
              <div className="pdp-size-section" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="pdp-size-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="pdp-label" style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', color: '#374151' }}>
                    SELECT SIZE {product.productType === 'bangle' ? '(BANGLE)' : product.productType === 'ring' ? '(RING)' : ''}
                  </span>
                  <span className="pdp-selected-size" style={{ fontSize: '0.85rem' }}>
                    {selectedSize ? <strong style={{ color: '#111827' }}>Size {selectedSize}</strong> : <em style={{ color: '#d32f2f' }}>Select size</em>}
                  </span>
                </div>

                <div className="pdp-size-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(product.productType === 'bangle'
                    ? ['2.2', '2.4', '2.6', '2.8', '2.10']
                    : product.productType === 'ring'
                    ? ['6', '7', '8', '9', '16', '17', '18']
                    : productSizes.map((s) => s.size)
                  ).map((szStr) => {
                    const sRec = productSizes.find((s) => s.size === szStr);
                    const sStock = sRec ? sRec.stock : 0;
                    const isAvailable = sStock > 0;
                    const isSelected = selectedSize === szStr;

                    return (
                      <button
                        key={szStr}
                        type="button"
                        className={`pdp-size-btn ${isSelected ? 'active' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedSize(szStr);
                            setSizeError('');
                          }
                        }}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #111827' : '1px solid #d1d5db',
                          backgroundColor: isSelected ? '#111827' : isAvailable ? '#ffffff' : '#f3f4f6',
                          color: isSelected ? '#ffffff' : isAvailable ? '#111827' : '#9ca3af',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.875rem',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          textDecoration: !isAvailable ? 'line-through' : 'none',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                        }}
                        title={isAvailable ? `Size ${szStr} (${sStock} in stock)` : `Size ${szStr} (Out of Stock)`}
                      >
                        {szStr}
                      </button>
                    );
                  })}
                </div>

                {sizeError && <p className="pdp-error-msg" style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.4rem' }}>{sizeError}</p>}
              </div>
            )}

            {/* Quantity & Stock Availability */}
            <div className="pdp-stock-qty-row">
              <div className="pdp-qty-wrap">
                <span className="pdp-label">QUANTITY</span>
                <div className="pdp-qty-control">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={(isSizedProduct ? activeSizeStock : product.stock) <= 0 || qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min((isSizedProduct ? activeSizeStock : product.stock) || 1, qty + 1))}
                    disabled={(isSizedProduct ? activeSizeStock : product.stock) <= 0 || qty >= (isSizedProduct ? activeSizeStock : product.stock)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="pdp-stock-status">
                {isSizedProduct && !selectedSize ? (
                  <span className="pdp-stock-badge select-size">
                    <span className="dot" style={{ backgroundColor: '#f59e0b' }} /> Please select size
                  </span>
                ) : (isSizedProduct ? activeSizeStock : product.stock) > 5 ? (
                  <span className="pdp-stock-badge in-stock">
                    <span className="dot" /> In Stock — Ready to ship
                  </span>
                ) : (isSizedProduct ? activeSizeStock : product.stock) > 0 ? (
                  <span className="pdp-stock-badge low-stock">
                    <span className="dot" /> Low Stock (Only {isSizedProduct ? activeSizeStock : product.stock} left)
                  </span>
                ) : (
                  <span className="pdp-stock-badge out-of-stock">
                    <span className="dot" /> Sold Out
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pdp-actions">
              <button
                className={`button pdp-btn-add ${addedSuccess ? 'added' : ''}`}
                disabled={(isSizedProduct ? activeSizeStock : product.stock) <= 0 || isAdding}
                onClick={add}
              >
                {isAdding
                  ? 'ADDING TO BAG...'
                  : addedSuccess
                  ? '✓ ADDED TO BAG'
                  : (isSizedProduct ? activeSizeStock : product.stock) > 0
                  ? 'ADD TO BAG'
                  : 'OUT OF STOCK'}
              </button>

              <button
                className="button secondary pdp-btn-buy"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
              >
                BUY NOW
              </button>

              <button
                className={`pdp-btn-wishlist ${wishlist.includes(product.id) ? 'active' : ''}`}
                onClick={() => toggleWishlist(product.id, product)}
                aria-label="Toggle Wishlist"
              >
                <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                <span>{wishlist.includes(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Pincode Delivery Checker */}
            <div className="pdp-pincode-card">
              <div className="pdp-pincode-head">
                <Truck size={18} className="pdp-pincode-icon" />
                <div>
                  <strong>Check Delivery Availability</strong>
                  <p>Enter your 6-digit Indian pincode for delivery estimate</p>
                </div>
              </div>

              <form onSubmit={handleCheckPincode} className="pdp-pincode-form">
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                />
                <button type="submit" disabled={pinLoading}>
                  {pinLoading ? 'CHECKING...' : 'CHECK'}
                </button>
              </form>

              {pinResult && (
                <div className="pdp-pincode-result">
                  {pinResult.error ? (
                    <p className="error">❌ {pinResult.error}</p>
                  ) : (
                    <p className="success">
                      ✓ Delivery Available! Estimated {pinResult.estimate || '3–5 working days'}.
                      {pinResult.shippingCharge !== undefined &&
                        (pinResult.shippingCharge === 0
                          ? ' (Free Shipping)'
                          : ` (Shipping Charge: ₹${pinResult.shippingCharge})`)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Accordions Section */}
            <div className="pdp-accordions">
              {[
                { id: 'DETAILS', label: 'PRODUCT DETAILS & SPECIFICATIONS' },
                { id: 'ANTI_TARNISH', label: 'ANTI-TARNISH & CARE GUIDE' },
                { id: 'SHIPPING', label: 'SHIPPING & FAST DELIVERY' },
                { id: 'RETURNS', label: 'EASY 7-DAY RETURNS' },
              ].map((acc) => {
                const isOpen = openAccordion === acc.id;
                return (
                  <div className={`pdp-accordion-item ${isOpen ? 'open' : ''}`} key={acc.id}>
                    <button
                      type="button"
                      className="pdp-accordion-btn"
                      onClick={() => setOpenAccordion(isOpen ? '' : acc.id)}
                    >
                      <span>{acc.label}</span>
                      <ChevronDown size={16} className={`pdp-accordion-icon ${isOpen ? 'rotate' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="pdp-accordion-body">
                        {acc.id === 'DETAILS' && (
                          <div className="pdp-spec-table">
                            <div className="pdp-spec-row">
                              <span>Material</span>
                              <strong>{product.material || 'Premium Stainless Steel / 18K Gold Plated'}</strong>
                            </div>
                            <div className="pdp-spec-row">
                              <span>Finish</span>
                              <strong>{product.finish || 'Anti-Tarnish High Polish'}</strong>
                            </div>
                            <div className="pdp-spec-row">
                              <span>Category</span>
                              <strong>{product.category}</strong>
                            </div>
                            {hasColors && (
                              <div className="pdp-spec-row">
                                <span>Available Colours</span>
                                <strong>{productColors.join(', ')}</strong>
                              </div>
                            )}
                            <div className="pdp-spec-row">
                              <span>Hypoallergenic</span>
                              <strong>Yes (Lead & Nickel Free)</strong>
                            </div>
                          </div>
                        )}

                        {acc.id === 'ANTI_TARNISH' && (
                          <div className="pdp-accordion-text">
                            <p>✨ <strong>Crafted for Longevity:</strong> RIZ BY SHIJIRIJU jewellery is engineered with a multi-layer anti-tarnish protective coating that resists water, sweat, and daily humidity.</p>
                            <ul>
                              <li>Wipe gently with a soft microfibre cloth after wearing.</li>
                              <li>Avoid direct prolonged exposure to harsh perfumes, hairsprays, or alcohol sanitizers.</li>
                              <li>Store individually in the signature RIZ soft velvet pouch.</li>
                            </ul>
                          </div>
                        )}

                        {acc.id === 'SHIPPING' && (
                          <div className="pdp-accordion-text">
                            <p>🚚 <strong>Express Shipping across India:</strong> Orders are processed within 24 hours. Delivery usually takes 3–5 working days depending on your pincode.</p>
                            <p>✈️ <strong>International Shipping Available:</strong> We ship worldwide with full end-to-end tracking.</p>
                          </div>
                        )}

                        {acc.id === 'RETURNS' && (
                          <div className="pdp-accordion-text">
                            <p>📦 <strong>7-Day Hassle-Free Returns:</strong> If you receive a damaged item or wish to exchange, simply contact our WhatsApp support at <strong>+91 9072308686</strong> within 7 days of delivery.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lightbox Image Overlay Modal */}
        {lightboxOpen && (
          <div className="pdp-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
            <div className="pdp-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="pdp-lightbox-close"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close Lightbox"
              >
                <X size={24} />
              </button>

              <div className="pdp-lightbox-img-wrap">
                <Image
                  src={getValidImageUrl(product.images[activeImage] || product.images[0])}
                  alt={product.name}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {product.images.length > 1 && (
                <>
                  <button
                    className="pdp-lightbox-nav prev"
                    onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    aria-label="Previous Image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="pdp-lightbox-nav next"
                    onClick={() => setActiveImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    aria-label="Next Image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related-section">
            <div className="section-head">
              <div>
                <span className="eyebrow">CURATED RECOMMENDATIONS</span>
                <h2>You May Also Like</h2>
              </div>
            </div>
            <ProductGrid items={relatedProducts} />
          </section>
        )}
      </div>

      {/* Sticky Product Purchase Bar */}
      <div className={`sticky-purchase-bar ${showStickyBar ? 'visible' : ''}`}>
        <div className="sticky-purchase-inner">
          <div className="sticky-purchase-info">
            <span className="sticky-purchase-title">{product.name}</span>
            {selectedColor && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>({selectedColor})</span>}
            <span className="sticky-purchase-price">₹{(product.price || 0).toLocaleString('en-IN')}</span>
          </div>
          <button
            className="button"
            style={{ padding: '10px 20px', fontSize: '0.78rem' }}
            disabled={product.stock <= 0 || isAdding}
            onClick={add}
          >
            {isAdding ? 'ADDING...' : addedSuccess ? '✓ ADDED' : 'ADD TO BAG'}
          </button>
        </div>
      </div>
    </main>
  );
}
