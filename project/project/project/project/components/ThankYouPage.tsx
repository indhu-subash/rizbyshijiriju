'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, AlertCircle, Clock, ShoppingBag, Truck, MessageCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface OrderItemData {
  id?: string;
  productId?: string;
  productCode?: string | null;
  name: string;
  price?: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
  image?: string;
}

interface OrderData {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  total?: number;
  subtotal?: number;
  discount?: number;
  shippingCharge?: number;
  shippingName?: string;
  createdAt?: string;
  items?: OrderItemData[];
}

export function ThankYouPage() {
  const searchParams = useSearchParams();
  const rawOrderId = searchParams ? searchParams.get('orderId') || searchParams.get('order') || '' : '';
  const orderId = useMemo(() => rawOrderId.trim(), [rawOrderId]);

  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const trackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    async function fetchAndVerifyOrder() {
      try {
        const res = await api.orders.track(orderId);
        if (!isMounted) return;

        if (!res || !res.order) {
          setError('Order details could not be retrieved from the server.');
          return;
        }

        setOrder(res.order);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to verify order on Thank You page:', err);
        setError(err.message || 'We could not verify this order. Please check the Order ID or contact support.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAndVerifyOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Determine confirmation state strictly from backend-verified data
  const isCancelled = useMemo(() => {
    if (!order) return false;
    const status = (order.orderStatus || '').toLowerCase();
    const payStatus = (order.paymentStatus || '').toLowerCase();
    return status === 'cancelled' || payStatus === 'cancelled' || payStatus === 'failed';
  }, [order]);

  const isPending = useMemo(() => {
    if (!order || isCancelled) return false;
    const payMethod = (order.paymentMethod || '').toLowerCase();
    const payStatus = (order.paymentStatus || '').toLowerCase();
    const ordStatus = (order.orderStatus || '').toLowerCase();

    // COD is confirmed upon placement
    if (payMethod === 'cod') return false;

    // Online payments require paid status or Confirmed status
    return payStatus !== 'paid' && ordStatus !== 'confirmed';
  }, [order, isCancelled]);

  const isConfirmed = useMemo(() => {
    if (!order || isCancelled || isPending) return false;
    const payMethod = (order.paymentMethod || '').toLowerCase();
    const payStatus = (order.paymentStatus || '').toLowerCase();
    const ordStatus = (order.orderStatus || '').toLowerCase();

    if (payMethod === 'cod') {
      return ordStatus !== 'cancelled';
    }

    return payStatus === 'paid' || ordStatus === 'confirmed';
  }, [order, isCancelled, isPending]);

  // Google Tag Manager GA4 purchase tracking with strict deduplication
  useEffect(() => {
    if (!order || !isConfirmed || trackedRef.current) return;

    const storageKey = `riz_gtm_purchase_${order.orderId}`;
    let alreadyTracked = false;

    try {
      alreadyTracked = localStorage.getItem(storageKey) === 'true';
    } catch (e) {
      // Storage access blocked or restricted
    }

    if (alreadyTracked) {
      trackedRef.current = true;
      return;
    }

    // Set deduplication flag immediately
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (e) {}
    trackedRef.current = true;

    // Prepare clean GA4 items array without customer PII
    const items = (order.items || []).map((item, index) => ({
      item_id: item.productCode || item.productId || item.id || `ITEM_${index + 1}`,
      item_name: item.name,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      item_variant: [item.color, item.size].filter(Boolean).join(' / ') || undefined,
      index,
    }));

    const finalValue = typeof order.total === 'number' ? order.total : 0;

    // Safely push to existing window.dataLayer without overwriting
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object per GA4 standard
      w.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: order.orderId,
          value: finalValue,
          currency: 'INR',
          items,
        },
      });
    }
  }, [order, isConfirmed]);

  // 1. Loading State
  if (loading) {
    return (
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 16px', color: '#334c3d' }} />
          <span className="eyebrow">Verifying Order</span>
          <h2 className="serif" style={{ margin: '8px 0 0', fontSize: '1.6rem' }}>
            Retrieving your order confirmation...
          </h2>
        </div>
      </main>
    );
  }

  // 2. Missing Order ID
  if (!orderId) {
    return (
      <main>
        <section className="container" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: '#f5f0eb', color: '#a9895b', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <AlertCircle size={32} />
          </div>
          <span className="eyebrow">Order Confirmation</span>
          <h1 className="serif font-semibold" style={{ fontSize: '2.2rem', margin: '12px 0' }}>
            No Order Specified
          </h1>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.6', marginBottom: '28px' }}>
            We could not find an order to display. If you recently completed a checkout, please check your email for your confirmation details or track your order with your Order ID.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="button">
              Continue Shopping
            </Link>
            <Link href="/track-order" className="button secondary">
              Track an Order
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3. Error / Order Not Found
  if (error || !order) {
    return (
      <main>
        <section className="container" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: '#fdf2f2', color: '#d32f2f', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <AlertCircle size={32} />
          </div>
          <span className="eyebrow" style={{ color: '#d32f2f' }}>Verification Notice</span>
          <h1 className="serif font-semibold" style={{ fontSize: '2.2rem', margin: '12px 0' }}>
            Order Not Found
          </h1>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.6', marginBottom: '28px' }}>
            We could not locate confirmed details for order <strong>#{orderId}</strong>. {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="button">
              Return to Shop
            </Link>
            <Link href={`/track-order?order=${encodeURIComponent(orderId)}`} className="button secondary">
              Retry Order Tracking
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 4. Cancelled or Failed Order
  if (isCancelled) {
    return (
      <main>
        <section className="container" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: '#fdf2f2', color: '#d32f2f', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <AlertCircle size={32} />
          </div>
          <span className="eyebrow" style={{ color: '#d32f2f' }}>Order Cancelled</span>
          <h1 className="serif font-semibold" style={{ fontSize: '2.2rem', margin: '12px 0' }}>
            Order Not Confirmed
          </h1>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Order <strong>#{order.orderId}</strong> was cancelled or the payment was not completed. No charges have been made.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cart" className="button">
              View Your Bag
            </Link>
            <Link href="/shop" className="button secondary">
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 5. Payment Pending Order
  if (isPending) {
    return (
      <main>
        <section className="container" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: '#fff8e6', color: '#b78103', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <Clock size={32} />
          </div>
          <span className="eyebrow" style={{ color: '#b78103' }}>Payment Pending</span>
          <h1 className="serif font-semibold" style={{ fontSize: '2.2rem', margin: '12px 0' }}>
            Awaiting Confirmation
          </h1>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Order <strong>#{order.orderId}</strong> has been created, but payment verification is still pending. If you just completed payment, please allow a moment and refresh this page.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.reload()} className="button">
              Refresh Status
            </button>
            <Link href={`/track-order?order=${encodeURIComponent(order.orderId)}`} className="button secondary">
              Track Order Status
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 6. Confirmed Order Success View
  const waMessage = encodeURIComponent(
    `Hi RIZ by Shijiriju, I have placed Order #${order.orderId}. Please process my order!`
  );

  return (
    <main>
      <section className="container" style={{ maxWidth: '780px', margin: '48px auto', padding: '0 20px' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 20px',
              background: '#334c3d',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 24px rgba(51, 76, 61, 0.2)',
            }}
          >
            <Check size={36} />
          </div>
          <span className="eyebrow" style={{ color: '#a9895b' }}>Order Confirmed</span>
          <h1 className="serif font-semibold" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', margin: '12px 0' }}>
            Thank you for your purchase.<br />
            <i style={{ fontWeight: 400, color: '#334c3d' }}>Your order is confirmed.</i>
          </h1>
          <p style={{ color: '#555', fontSize: '1.05rem', maxWidth: '540px', margin: '0 auto' }}>
            Your order <strong>#{order.orderId}</strong> has been received and verified. A confirmation receipt has been dispatched.
          </p>
        </div>

        {/* Order Details Card */}
        <div
          style={{
            background: '#faf9f6',
            border: '1px solid #ede5db',
            borderRadius: '12px',
            padding: '24px 28px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid #ede5db',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', fontWeight: 600 }}>
                Order Number
              </span>
              <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '1.1rem', color: '#334c3d', fontFamily: 'monospace' }}>
                #{order.orderId}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', fontWeight: 600 }}>
                Payment Status
              </span>
              <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.95rem', color: order.paymentStatus === 'paid' ? '#2e7d32' : '#334c3d' }}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery (Confirmed)' : order.paymentStatus === 'paid' ? 'Paid Securely' : 'Confirmed'}
              </p>
            </div>
          </div>

          {/* Purchased Items List */}
          {order.items && order.items.length > 0 && (
            <div style={{ padding: '20px 0', borderBottom: '1px solid #ede5db' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                Items Ordered ({order.items.reduce((sum, it) => sum + (it.quantity || 1), 0)})
              </span>
              <div style={{ display: 'grid', gap: '14px' }}>
                {order.items.map((it, idx) => {
                  const lineTotal = typeof it.price === 'number' ? it.price * (it.quantity || 1) : null;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {it.image ? (
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', background: '#f5f0eb', flexShrink: 0, position: 'relative' }}>
                            <Image src={it.image} alt={it.name} fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#ede5db', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#334c3d' }}>
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>
                            {it.name}
                          </p>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            Qty: <strong>{it.quantity}</strong>
                            {(it.color || it.size) && (
                              <span>
                                {' '}&bull; {[it.color ? `Colour: ${it.color}` : null, it.size ? `Size: ${it.size}` : null].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {lineTotal !== null ? (
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#222' }}>
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{ color: '#888', fontSize: '0.85rem' }}>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          <div style={{ padding: '16px 0 0', display: 'grid', gap: '8px' }}>
            {typeof order.subtotal === 'number' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#555' }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {typeof order.discount === 'number' && order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#2e7d32' }}>
                <span>Coupon Discount</span>
                <span>-₹{order.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {typeof order.shippingCharge === 'number' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#555' }}>
                <span>Shipping</span>
                <span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge.toLocaleString('en-IN')}`}</span>
              </div>
            )}
            {typeof order.total === 'number' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#334c3d',
                  paddingTop: '10px',
                  borderTop: '1px solid #ede5db',
                  marginTop: '4px',
                }}
              >
                <span>Total Paid / Payable</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px', margin: '0 auto' }}>
          <Link href="/shop" className="button" style={{ textAlign: 'center', width: '100%', padding: '14px 20px', fontSize: '0.95rem' }}>
            Continue Shopping
          </Link>

          <Link
            href={`/track-order?order=${encodeURIComponent(order.orderId)}`}
            className="button secondary"
            style={{ textAlign: 'center', width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Truck size={18} /> Track Order Status
          </Link>

          <a
            href={`https://wa.me/919072308686?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#25D366',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
            }}
          >
            <MessageCircle size={18} /> Connect on WhatsApp (+91 9072308686)
          </a>
        </div>
      </section>
    </main>
  );
}

