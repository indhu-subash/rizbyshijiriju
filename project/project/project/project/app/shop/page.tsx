import { Suspense } from 'react';
import { ShopPage } from '@/components/ShopPage';
import { Loader2 } from 'lucide-react';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const collection = typeof params.collection === 'string' ? params.collection : undefined;
  const query = typeof params.query === 'string' ? params.query : typeof params.q === 'string' ? params.q : undefined;

  return (
    <Suspense
      fallback={
        <div style={{ padding: '90px 0', textAlign: 'center' }}>
          <Loader2 size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
          <p className="muted" style={{ marginTop: '16px', fontSize: '13px' }}>
            Loading collection...
          </p>
        </div>
      }
    >
      <ShopPage initialCategory={category} initialCollection={collection} initialQuery={query} />
    </Suspense>
  );
}
