'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, Trash2, Check, Truck, Gift, Package } from 'lucide-react';
import { useState } from 'react';
import { getValidImageUrl } from './ProductCard';
import { useStore } from './StoreProvider';
import { api } from '@/lib/api';

const TIER_1_SHIPPING = 599;
const TIER_2_GIFT = 899;
const TIER_3_ORGANISER = 1199;

export function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart } = useStore();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');

  const isFreeShipping = subtotal >= TIER_1_SHIPPING || subtotal === 0;
  const isFreeGift = subtotal >= TIER_2_GIFT;
  const isOrganiser = subtotal >= TIER_3_ORGANISER;
  const total = Math.max(0, subtotal - discount);

  // Remaining calculation for AOV progress banner
  let rewardMessage = '';
  if (subtotal < TIER_1_SHIPPING) {
    const remaining = TIER_1_SHIPPING - subtotal;
    rewardMessage = `Add ₹${remaining.toLocaleString('en-IN')} more to get Free Shipping`;
  } else if (subtotal < TIER_2_GIFT) {
    const remaining = TIER_2_GIFT - subtotal;
    rewardMessage = `Add ₹${remaining.toLocaleString('en-IN')} more to get Free Gift`;
  } else if (subtotal < TIER_3_ORGANISER) {
    const remaining = TIER_3_ORGANISER - subtotal;
    rewardMessage = `Add ₹${remaining.toLocaleString('en-IN')} more to get Jewellery Organiser`;
  } else {
    rewardMessage = `🎉 Congratulations! You have unlocked Free Shipping, Free Gift & Organiser!`;
  }

  // Progress percentage across the three milestones (0% to 100%)
  let progressPercent = 0;
  if (subtotal <= 0) {
    progressPercent = 0;
  } else if (subtotal < TIER_1_SHIPPING) {
    progressPercent = Math.min(33.3, (subtotal / TIER_1_SHIPPING) * 33.3);
  } else if (subtotal < TIER_2_GIFT) {
    progressPercent = 33.3 + Math.min(33.3, ((subtotal - TIER_1_SHIPPING) / (TIER_2_GIFT - TIER_1_SHIPPING)) * 33.3);
  } else if (subtotal < TIER_3_ORGANISER) {
    progressPercent = 66.6 + Math.min(33.4, ((subtotal - TIER_2_GIFT) / (TIER_3_ORGANISER - TIER_2_GIFT)) * 33.4);
  } else {
    progressPercent = 100;
  }

  async function apply() {
    setMessage('');
    try {
      const res = await api.payments.validateCoupon({ couponCode: coupon, subtotal });
      if (res.valid) {
        setDiscount(res.discount);
        setMessage('Coupon applied successfully!');
      } else {
        setDiscount(0);
        setMessage('Invalid coupon code.');
      }
    } catch (err: any) {
      setDiscount(0);
      setMessage(err.message || 'Failed to apply coupon.');
    }
  }

  return (
    <main>
      <div className="page-intro container">
        <span className="eyebrow">Your edit</span>
        <h1 className="serif">Shopping bag</h1>
      </div>
      <section className="cart-layout container">
        {cart.length ? (
          <>
            <div className="cart-items">
              {/* Average Order Value (AOV) Reward Progress Widget */}
              <div className="aov-tracker-card">
                <div className="aov-banner">
                  <span>{rewardMessage}</span>
                </div>
                <div className="aov-progress-container">
                  <div className="aov-progress-bar-bg">
                    <div
                      className="aov-progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="aov-milestones">
                    {/* Milestone 1: Free Shipping */}
                    <div className={`aov-milestone ${isFreeShipping ? 'active' : ''}`}>
                      <span className="aov-node-title">FREE SHIPPING</span>
                      <div className="aov-node-icon">
                        {isFreeShipping ? <Check size={14} strokeWidth={2.5} /> : <Truck size={14} />}
                      </div>
                      <span className="aov-node-badge">₹599</span>
                    </div>

                    {/* Milestone 2: Free Gift */}
                    <div className={`aov-milestone ${isFreeGift ? 'active' : ''}`}>
                      <span className="aov-node-title">FREE GIFT</span>
                      <div className="aov-node-icon">
                        {isFreeGift ? <Check size={14} strokeWidth={2.5} /> : <Gift size={14} />}
                      </div>
                      <span className="aov-node-badge">₹899</span>
                    </div>

                    {/* Milestone 3: Organiser */}
                    <div className={`aov-milestone ${isOrganiser ? 'active' : ''}`}>
                      <span className="aov-node-title">ORGANISER</span>
                      <div className="aov-node-icon">
                        {isOrganiser ? <Check size={14} strokeWidth={2.5} /> : <Package size={14} />}
                      </div>
                      <span className="aov-node-badge">₹1,199</span>
                    </div>
                  </div>
                </div>
              </div>

              {cart.map(({ product, quantity, color, size }) => {
                const productSlug = product.slug || product.id || encodeURIComponent(product.name);
                const imageUrl = getValidImageUrl(product.images?.[0]);

                return (
                  <div className="cart-item" key={`${product.id}-${color || 'default'}-${size || 'default'}`}>
                    <Link href={`/product/${productSlug}`} className="cart-thumb">
                      <Image src={imageUrl} alt={product.name} fill sizes="110px" />
                    </Link>
                    <div className="cart-item-copy">
                      <span className="eyebrow">{product.category}</span>
                      <Link href={`/product/${productSlug}`}>
                        <h3 className="serif hover:underline">{product.name}</h3>
                      </Link>
                      <div className="cart-item-variants" style={{ display: 'flex', gap: '12px', marginTop: '2px', marginBottom: '4px' }}>
                        {color && (
                          <p className="text-xs text-muted-foreground" style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                            Colour: <b>{color}</b>
                          </p>
                        )}
                        {size && (
                          <p className="text-xs text-muted-foreground" style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                            Size: <b>{size}</b>
                          </p>
                        )}
                      </div>
                      <div className="cart-item-price-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 10px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>₹{(product.price || 0).toLocaleString('en-IN')}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <del style={{ color: '#888', fontSize: '0.85rem' }}>₹{product.originalPrice.toLocaleString('en-IN')}</del>
                        )}
                      </div>
                      <div className="cart-actions">
                        <div className="quantity">
                          <button onClick={() => updateQuantity(product.id, color, size, quantity - 1)} aria-label="Decrease quantity">
                            <Minus size={13} />
                          </button>
                          <span>{quantity}</span>
                          <button onClick={() => updateQuantity(product.id, color, size, quantity + 1)} aria-label="Increase quantity">
                            <Plus size={13} />
                          </button>
                        </div>
                        <button className="remove" onClick={() => removeFromCart(product.id, color, size)} aria-label="Remove item">
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                    <strong>₹{((product.price || 0) * quantity).toLocaleString('en-IN')}</strong>
                  </div>
                );
              })}
            </div>
            <aside className="summary">
              <h2 className="serif">Order summary</h2>
              <div className="summary-line">
                <span>Subtotal</span>
                <b>₹{(subtotal || 0).toLocaleString('en-IN')}</b>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <b>{isFreeShipping ? 'Free' : 'Calculated at checkout'}</b>
              </div>
              {discount > 0 && (
                <div className="summary-line discount">
                  <span>Discount</span>
                  <b>−₹{(discount || 0).toLocaleString('en-IN')}</b>
                </div>
              )}
              <div className="coupon">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter coupon code" />
                <button onClick={apply}>Apply</button>
              </div>
              {message && <small className={discount ? 'coupon-ok' : 'coupon-error'}>{message}</small>}
              <div className="summary-total">
                <span>Total</span>
                <strong>₹{(total || 0).toLocaleString('en-IN')}</strong>
              </div>
              <Link href="/checkout" className="button add-button">
                Proceed to checkout <ArrowRight size={15} />
              </Link>
              <p className="summary-note">Free shipping on orders over ₹599 · Free gift on orders over ₹899</p>
            </aside>
          </>
        ) : (
          <div className="empty-state cart-empty">
            <span className="eyebrow">Nothing here yet</span>
            <h2 className="serif">Your bag is waiting.</h2>
            <p>Find a piece that feels like you.</p>
            <Link href="/shop" className="button">
              Explore jewellery
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
