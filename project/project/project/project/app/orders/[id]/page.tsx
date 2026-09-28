import { TrackPage } from '@/components/TrackPage';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <TrackPage />;
}
