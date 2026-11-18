import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ThankYouPage } from '@/components/ThankYouPage';

export const metadata: Metadata = {
  title: 'Thank You for Your Order',
  description: 'Your order confirmation and purchase details.',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '60px 20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow">Order Confirmation</span>
            <h2 className="serif" style={{ margin: '8px 0 0', fontSize: '1.6rem' }}>
              Loading order confirmation...
            </h2>
          </div>
        </main>
      }
    >
      <ThankYouPage />
    </Suspense>
  );
}

