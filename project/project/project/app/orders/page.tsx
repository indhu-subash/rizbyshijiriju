'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="container py-20 text-center" style={{ textAlign: 'center', padding: '80px 0' }}>
      <p className="muted">Redirecting to your order history...</p>
    </div>
  );
}
