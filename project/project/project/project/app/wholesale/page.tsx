import type { Metadata } from 'next';
import { WholesalePage } from '@/components/WholesalePage';

export const metadata: Metadata = {
  title: 'Wholesale',
  description: 'Explore wholesale opportunities with RIZ by Shijiriju. Send an enquiry or chat with us on WhatsApp.',
};

export default function Page() {
  return <WholesalePage />;
}
