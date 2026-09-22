import { Suspense } from 'react';
import { TrackPage } from '@/components/TrackPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="container text-center py-20">Loading order tracker...</div>}>
      <TrackPage />
    </Suspense>
  );
}
