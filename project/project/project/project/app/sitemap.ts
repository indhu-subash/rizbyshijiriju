import { MetadataRoute } from 'next';import { products } from '@/data/products';
export default function sitemap():MetadataRoute.Sitemap{const base='https://rizbyshijiriju.com';return [{url:base},{url:`${base}/shop`},{url:`${base}/about`},{url:`${base}/contact`},...products.map(p=>({url:`${base}/product/${p.slug}`}))]}
