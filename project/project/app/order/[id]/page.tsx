import { TrackPage } from '@/components/TrackPage';

export default async function OrderAliasPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <TrackPage />;
}
