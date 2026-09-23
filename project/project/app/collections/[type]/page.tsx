import { CollectionPage } from '@/components/CollectionPage';
import { products as localProducts } from '@/data/products';

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
      image: 'https://images.pexels.com/photos/29502912/pexels-photo-29502912.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'traditional': {
      title: 'Tradition, Reimagined',
      description: 'Pieces inspired by the beauty of Kerala, thoughtfully interpreted for today.',
      dbCollectionName: 'Traditional',
      filter: (p) => p.collection === 'Traditional',
      image: 'https://images.pexels.com/photos/38344601/pexels-photo-38344601.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'bridal': {
      title: 'Bridal Collection',
      description: 'For moments that deserve to last forever.',
      dbCollectionName: 'Bridal',
      filter: (p) => p.collection === 'Bridal',
      image: 'https://images.pexels.com/photos/9901809/pexels-photo-9901809.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'mens': {
      title: 'For Him',
      description: 'Refined jewellery for everyday confidence.',
      dbCollectionName: "Men's",
      filter: (p) => p.collection === "Men's" || p.gender === 'Men',
      image: 'https://images.pexels.com/photos/8512143/pexels-photo-8512143.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'kids': {
      title: 'Little Treasures',
      description: 'Sweet, delicate pieces made for little celebrations.',
      dbCollectionName: 'Kids',
      filter: (p) => p.collection === 'Kids' || p.ageGroup === 'Kids',
      image: 'https://images.pexels.com/photos/37601638/pexels-photo-37601638.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'hair-accessories': {
      title: 'Hair Accessories',
      description: 'Beautiful details to elevate your hair styling.',
      dbCollectionName: 'Hair Accessories',
      filter: (p) => p.collection === 'Hair Accessories' || p.category === 'Hair Accessories',
      image: 'https://images.pexels.com/photos/30200528/pexels-photo-30200528.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'silver-replica': {
      title: 'Silver Replica',
      description: 'Premium 925 silver lookalikes with intricate craftsmanship.',
      dbCollectionName: 'Silver Replica',
      filter: (p) => p.collection === 'Silver Replica',
      image: 'https://images.pexels.com/photos/6256046/pexels-photo-6256046.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'diamond-replica': {
      title: 'Diamond Replica',
      description: 'Sparkling diamond-like stones that shine bright.',
      dbCollectionName: 'Diamond Replica',
      filter: (p) => p.collection === 'Diamond Replica',
      image: 'https://images.pexels.com/photos/29502932/pexels-photo-29502932.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'ad-collections': {
      title: 'AD Collections',
      description: 'Exquisite American Diamond jewellery for all occasions.',
      dbCollectionName: 'AD Collections',
      filter: (p) => p.collection === 'AD Collections',
      image: 'https://images.pexels.com/photos/29502969/pexels-photo-29502969.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'fancy': {
      title: 'Fancy Jewellery',
      description: 'Trendy, playful designs for your style experiments.',
      dbCollectionName: 'Fancy',
      filter: (p) => p.collection === 'Fancy',
      image: 'https://images.pexels.com/photos/21235147/pexels-photo-21235147.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'gold-covering-micro-plated': {
      title: 'Gold Covering & Micro Plated',
      description: 'Premium gold-plated finish that lasts long.',
      dbCollectionName: 'Gold Covering & Micro Plated',
      filter: (p) => p.collection === 'Gold Covering & Micro Plated',
      image: 'https://images.pexels.com/photos/19373665/pexels-photo-19373665.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
    'riz-house-of-fashion': {
      title: 'RIZ House of Fashion',
      description: 'Our signature luxury and high-fashion edits.',
      dbCollectionName: 'RIZ House of Fashion',
      filter: (p) => p.collection === 'RIZ House of Fashion',
      image: 'https://images.pexels.com/photos/10907855/pexels-photo-10907855.jpeg?auto=compress&cs=tinysrgb&w=1800',
    },
  };

  const config = configs[type] || configs['anti-tarnish'];
  
  // Fetch from the backend API, falling back to local filter on error
  let items: any[] | undefined = undefined;
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rizbyshijiriju-production-2116.up.railway.app/api';
    const res = await fetch(
      `${API_URL}/products?collection=${encodeURIComponent(config.dbCollectionName)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        items = data.products;
      }
    }
  } catch (error) {
    console.warn('Could not fetch from backend API for collection, using local fallback:', error);
  }

  return <CollectionPage title={config.title} description={config.description} collection={config.dbCollectionName} image={config.image} items={items} />;
}
