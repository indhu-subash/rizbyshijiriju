'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useStore } from './StoreProvider';
import { useEffect } from 'react';

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, removeFromCart, updateQuantity, subtotal, cartCount } = useStore();
  const FREE_SHIPPING_THRESHOLD = 2000;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="cart-drawer" aria-label="Shopping Cart Drawer">
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <h3>
            Shopping Bag {cartCount > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>({cartCount})</span>}
          </h3>
          <button className="cart-drawer-close" onClick={onClose} aria-label="Close cart drawer">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="cart-drawer-body">
          {/* Free Shipping Visual Progress Indicator */}
          <div className="free-shipping-card">
            <div className={`free-shipping-text ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'unlocked' : ''}`}>
              {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                <span>✓ FREE SHIPPING UNLOCKED</span>
              ) : (
                <span>
                  Add <strong>₹{remainingForFreeShipping.toLocaleString('en-IN')}</strong> more for FREE SHIPPING
                </span>
              )}
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>₹{subtotal.toLocaleString('en-IN')} / ₹2,000</span>
            </div>
            <div className="free-shipping-bar">
              <div className="free-shipping-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Cart Item List */}
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p className="serif" style={{ fontSize: '1.2rem', margin: '0 0 8px', color: 'var(--brown)' }}>
                Your bag is empty
              </p>
              <p style={{ fontSize: '0.85rem', margin: '0 0 24px' }}>Discover our handcrafted jewellery collections.</p>
              <Link href="/shop" className="button" onClick={onClose} style={{ width: '100%' }}>
                Explore Shop
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {cart.map(({ product, quantity, color }) => (
                <div
                  key={`${product.id}-${color || 'default'}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr',
                    gap: '14px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1/1.1',
                      background: 'var(--sand)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={onClose}
                          style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--brown)', lineHeight: 1.3 }}
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(product.id, color)}
                          aria-label="Remove item"
                          style={{ border: 0, background: 'none', color: 'var(--taupe)', padding: '2px', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {color && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                          Color: {color}
                        </span>
                      )}
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brown)', marginTop: '4px' }}>
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--line)',
                          borderRadius: '3px',
                          background: 'var(--paper)',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(product.id, color, quantity - 1)}
                          style={{ border: 0, background: 'none', width: '26px', height: '26px', display: 'grid', placeItems: 'center' }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.8rem', padding: '0 6px', minWidth: '20px', textAlign: 'center' }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, color, quantity + 1)}
                          style={{ border: 0, background: 'none', width: '26px', height: '26px', display: 'grid', placeItems: 'center' }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <Link href="/checkout" className="button" onClick={onClose} style={{ width: '100%' }}>
                Proceed to Checkout <ArrowRight size={15} />
              </Link>
              <Link href="/cart" className="button secondary" onClick={onClose} style={{ width: '100%' }}>
                View Full Bag
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
