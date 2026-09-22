'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Package, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const stages = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

function TrackFormContent() {
  const searchParams = useSearchParams();
  const orderParam = searchParams ? searchParams.get('order') || '' : '';

  const [id, setId] = useState('');
  const [tracked, setTracked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
    shippingName: string;
    createdAt: string;
    items: { name: string; quantity: number; color?: string | null }[];
  } | null>(null);

  useEffect(() => {
    if (orderParam) {
      setId(orderParam);
      handleTrack(orderParam);
    }
  }, [orderParam]);

  const handleTrack = async (orderIdToTrack: string) => {
    setLoading(true);
    setError('');
    setTracked(false);
    setOrderData(null);

    try {
      const res = await api.orders.track(orderIdToTrack.trim());
      setOrderData(res.order);
      setTracked(true);
    } catch (err: any) {
      setError(err.message || 'Order not found. Please verify the Order ID.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (id) {
      handleTrack(id);
    }
  };

  const getCurrentStageIndex = () => {
    if (!orderData) return -1;
    const status = orderData.orderStatus;

    if (status === 'Cancelled') return -1;
    if (status === 'Pending') return 0;

    const idx = stages.indexOf(status);
    return idx !== -1 ? idx : 0;
  };

  const activeStageIndex = getCurrentStageIndex();

  return (
    <>
      <form className="track-form" onSubmit={onSubmit}>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g. RIZ-2026-00124"
          disabled={loading}
          required
        />
        <button className="button" disabled={loading}>
          {loading ? 'Searching...' : 'Track order'}
        </button>
      </form>

      {error && (
        <section className="container text-center py-6" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="error-banner flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </section>
      )}

      {tracked && orderData && (
        <section className="tracking container">
          <div className="tracking-top">
            <span>
              <Package /> Order <b>{orderData.orderId}</b>
            </span>
            <span className={`pill ${orderData.orderStatus.toLowerCase()}`}>
              {orderData.orderStatus === 'Cancelled' ? 'Cancelled' : orderData.orderStatus === 'Delivered' ? 'Delivered' : 'In transit'}
            </span>
          </div>

          {orderData.items && orderData.items.length > 0 && (
            <div className="tracked-items-list my-4 p-3 bg-stone-50 rounded" style={{ margin: '12px 0', padding: '12px', background: '#faf9f6', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 600 }}>
                Items in this order:
              </span>
              <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0 0' }}>
                {orderData.items.map((it, idx) => (
                  <li key={idx} style={{ fontSize: '0.875rem', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <b>{it.name}</b> <small>× {it.quantity}</small>
                      {it.color && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#666' }}>
                          Colour: <b>{it.color}</b>
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {orderData.orderStatus === 'Cancelled' ? (
            <div className="error-banner my-6 text-center">
              This order was cancelled. If you believe this is an error, please contact support.
            </div>
          ) : (
            <div className="tracking-line">
              {stages.map((stage, i) => {
                const isCompleted = i <= activeStageIndex;
                return (
                  <div className={isCompleted ? 'done' : ''} key={stage}>
                    <span>{isCompleted ? <Check size={14} /> : <b>{i + 1}</b>}</span>
                    <small>{stage}</small>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tracking-note">
            <Truck />
            <span>
              {orderData.orderStatus === 'Delivered' ? (
                <>
                  <b>Delivered successfully</b>
                  <br />
                  Your package has been delivered. We hope it brings a lovely glow to your day!
                </>
              ) : orderData.orderStatus === 'Cancelled' ? (
                <>
                  <b>Order Cancelled</b>
                  <br />
                  No transit activity.
                </>
              ) : (
                <>
                  <b>On its way to you</b>
                  <br />
                  Your order is moving through our delivery network to <b>{orderData.shippingName}</b>.
                </>
              )}
            </span>
          </div>
        </section>
      )}
    </>
  );
}

export function TrackPage() {
  return (
    <main>
      <div className="content-hero container">
        <span className="eyebrow">A little reassurance</span>
        <h1 className="serif">Track your order.</h1>
        <p>Enter your order ID to see where your Riz is on its way to you.</p>

        <Suspense fallback={<div className="py-8 text-center muted"><Loader2 className="animate-spin inline" /> Loading tracker...</div>}>
          <TrackFormContent />
        </Suspense>
      </div>
    </main>
  );
}
