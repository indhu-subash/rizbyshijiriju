import { Suspense } from 'react';
import { ShopPage } from '@/components/ShopPage';
import { Loader2 } from 'lucide-react';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <div style={{ padding: '90px 0', textAlign: 'center' }}>
          <Loader2 size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
          <p className="muted" style={{ marginTop: '16px', fontSize: '13px' }}>
            Searching jewellery...
          </p>
        </div>
      }
    >
      <ShopPage initialQuery={params.q} />
    </Suspense>
  );
}
