import { notFound } from 'next/navigation';import { ProductDetail } from '@/components/ProductDetail';import { getProduct } from '@/data/products';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=getProduct(slug);if(!product)return notFound();return <ProductDetail product={product}/>}
