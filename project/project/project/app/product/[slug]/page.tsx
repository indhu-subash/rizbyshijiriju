import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/ProductDetail';
import { getProduct as getFallbackProduct } from '@/data/products';
import { api } from '@/lib/api';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug).trim();
  } catch (e) {
    decodedSlug = (slug || '').trim();
  }

  let product = null;

  try {
    const res = await api.products.getBySlug(decodedSlug);
    if (res && res.product) {
      product = {
        ...res.product,
        reviewCount: res.product.reviewCount ?? res.product.reviews ?? 0,
        colors: Array.isArray(res.product.colors) ? res.product.colors : [],
      };
    }
  } catch (err) {
    // getBySlug failed
  }

  if (!product) {
    try {
      const resById = await api.products.getById(decodedSlug);
      if (resById && resById.product) {
        product = {
          ...resById.product,
          reviewCount: resById.product.reviewCount ?? resById.product.reviews ?? 0,
          colors: Array.isArray(resById.product.colors) ? resById.product.colors : [],
        };
      }
    } catch (err2) {
      product = getFallbackProduct(decodedSlug);
    }
  }


  if (!product) return notFound();

  return <ProductDetail product={product} />;
}


