import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/ProductDetail';
import { getProduct as getFallbackProduct } from '@/data/products';
import { api } from '@/lib/api';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = null;

  try {
    const res = await api.products.getBySlug(slug);
    if (res && res.product) {
      product = {
        ...res.product,
        reviewCount: res.product.reviewCount ?? res.product.reviews ?? 0,
        colors: Array.isArray(res.product.colors) ? res.product.colors : [],
      };
    }
  } catch (err) {
    product = getFallbackProduct(slug);
  }

  if (!product) {
    product = getFallbackProduct(slug);
  }

  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
