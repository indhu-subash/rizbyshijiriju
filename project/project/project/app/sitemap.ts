import { MetadataRoute } from 'next';
import { products } from '@/data/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://rizbyshijiriju.vercel.app';

  const collections = [
    'anti-tarnish',
    'traditional',
    'bridal',
    'mens',
    'kids',
    'hair-accessories',
    'silver-replica',
    'diamond-replica',
    'ad-collections',
    'fancy',
    'gold-covering-micro-plated',
    'riz-house-of-fashion',
  ];

  const staticPages = [
    '',
    '/shop',
    '/new-arrivals',
    '/best-sellers',
    '/about',
    '/contact',
    '/track-order',
    '/care',
    '/shipping',
    '/returns',
    '/faq',
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${base}${page}`,
      lastModified: new Date(),
    })),
    ...collections.map((slug) => ({
      url: `${base}/collections/${slug}`,
      lastModified: new Date(),
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(),
    })),
  ];
}
