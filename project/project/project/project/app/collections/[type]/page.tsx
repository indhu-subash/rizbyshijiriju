import { CollectionPage } from '@/components/CollectionPage';
import { products as localProducts } from '@/data/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  const configs: Record<
    string,
    {
      title: string;
      description: string;
      dbCollectionName: string;
      filter: (p: any) => boolean;
      image: string;
    }
  > = {
    'anti-tarnish': {
      title: 'Anti-Tarnish Collection',
      description: 'Everyday pieces with an anti-tarnish finish and an easy shine.',
      dbCollectionName: 'Anti-Tarnish',
      filter: (p) => p.collection === 'Anti-Tarnish',
      image: '/anti-tarnish-collection.jpg',
    },
    'traditional': {
      title: 'Tradition, Reimagined',
      description: 'Pieces inspired by the beauty of Kerala, thoughtfully interpreted for today.',
      dbCollectionName: 'Traditional',
      filter: (p) => p.collection === 'Traditional',
      image: '/traditional-collection.png',
    },
    'bridal': {
      title: 'Bridal Collection',
      description: 'For moments that deserve to last forever.',
      dbCollectionName: 'Bridal',
      filter: (p) => p.collection === 'Bridal',
      image: '/bridal-collection.png',
    },
    'mens': {
      title: 'For Him',
      description: 'Refined jewellery for everyday confidence.',
      dbCollectionName: "Men's",
      filter: (p) => p.collection === "Men's" || p.gender === 'Men',
      image: '/mens-collection.png',
    },
    'kids': {
      title: 'Little Treasures',
      description: 'Sweet, delicate pieces made for little celebrations.',
      dbCollectionName: 'Kids',
      filter: (p) => p.collection === 'Kids' || p.ageGroup === 'Kids',
      image: '/kids-collection.jpg',
    },
    'hair-accessories': {
      title: 'Hair Accessories',
      description: 'Beautiful details to elevate your hair styling.',
      dbCollectionName: 'Hair Accessories',
      filter: (p) => p.collection === 'Hair Accessories' || p.category === 'Hair Accessories',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=80',
    },
    'silver-replica': {
      title: 'Silver Replica',
      description: 'Premium 925 silver lookalikes with intricate craftsmanship.',
      dbCollectionName: 'Silver Replica',
      filter: (p) => p.collection === 'Silver Replica',
      image: '/silver-replica-collection.png',
    },
    'diamond-replica': {
      title: 'Diamond Replica',
      description: 'Sparkling diamond-like stones that shine bright.',
      dbCollectionName: 'Diamond Replica',
      filter: (p) => p.collection === 'Diamond Replica',
      image: '/diamond-replica-collection.jpg',
    },
    'ad-collections': {
      title: 'AD Collections',
      description: 'Exquisite American Diamond jewellery for all occasions.',
      dbCollectionName: 'AD Collections',
      filter: (p) => p.collection === 'AD Collections',
      image: '/ad-collection.jpg',
    },
    'fancy': {
      title: 'Fancy Jewellery',
      description: 'Trendy, playful designs for your style experiments.',
      dbCollectionName: 'Fancy',
      filter: (p) => p.collection === 'Fancy',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1800&q=80',
    },
    'gold-covering-micro-plated': {
      title: 'Gold Covering & Micro Plated',
      description: 'Premium gold-plated finish that lasts long.',
      dbCollectionName: 'Gold Covering & Micro Plated',
      filter: (p) => p.collection === 'Gold Covering & Micro Plated',
      image: 'https://images.unsplash.com/photo-1611591475777-233cd749228e?auto=format&fit=crop&w=1800&q=80',
    },
    'riz-house-of-fashion': {
      title: 'RIZ House of Fashion',
      description: 'Our signature luxury and high-fashion edits.',
      dbCollectionName: 'RIZ House of Fashion',
      filter: (p) => p.collection === 'RIZ House of Fashion',
      image: '/riz-house-of-fashion.jpg',
    },
    'watches': {
      title: 'Watches Collection',
      description: 'Luxury and everyday watches collection.',
      dbCollectionName: 'Watches',
      filter: (p) => p.collection === 'Watches',
      image: '/watches-collection.png',
    },
  };

  const config = configs[type];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rizbyshijiriju-production-2116.up.railway.app/api';

  let title = config?.title || type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let description = config?.description || 'Explore our exquisite jewellery collection.';
  let image = config?.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1800&q=80';
  let dbCollectionName = config?.dbCollectionName || type;

  // Try fetching collection metadata from backend DB
  try {
    const colRes = await fetch(`${API_URL}/collections/${encodeURIComponent(type)}`, { cache: 'no-store' });
    if (colRes.ok) {
      const colData = await colRes.json();
      if (colData && colData.collection) {
        title = colData.collection.name;
        dbCollectionName = colData.collection.name;
        if (colData.collection.description) description = colData.collection.description;
        if (colData.collection.image) image = colData.collection.image;
      }
    }
  } catch (err) {
    // Ignore error and fall back
  }

  // Fetch products for this collection from backend API
  let items: any[] | undefined = undefined;
  try {
    const res = await fetch(
      `${API_URL}/products?collection=${encodeURIComponent(dbCollectionName)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        items = data.products;
      }
    }
  } catch (error) {
    console.warn('Could not fetch from backend API for collection, using local fallback:', error);
  }

  return <CollectionPage title={title} description={description} collection={dbCollectionName} image={image} items={items} />;
}
