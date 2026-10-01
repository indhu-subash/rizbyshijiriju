'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getValidImageUrl } from './ProductCard';
import { useStore } from './StoreProvider';

export function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart } = useStore();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');

  const isFreeShipping = subtotal >= 2000 || subtotal === 0;
  const total = Math.max(0, subtotal - discount);

  function apply() {
    if (['WELCOME10', 'RIZ10'].includes(coupon.toUpperCase())) {
      setDiscount(Math.round(subtotal * 0.1));
      setMessage('10% discount applied.');
    } else {
      setMessage('That coupon code isn’t valid.');
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
                      <p>₹{(product.price || 0).toLocaleString('en-IN')}</p>
                      <div className="cart-actions">
                        <div className="quantity">
                          <button onClick={() => updateQuantity(product.id, color, size, quantity - 1)}>
                            <Minus size={13} />
                          </button>
                          <span>{quantity}</span>
                          <button onClick={() => updateQuantity(product.id, color, size, quantity + 1)}>
                            <Plus size={13} />
                          </button>
                        </div>
                        <button className="remove" onClick={() => removeFromCart(product.id, color, size)}>
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
              <p className="summary-note">Free shipping on orders over ₹2,000 · Secure checkout</p>
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
