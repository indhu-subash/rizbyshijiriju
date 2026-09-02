import { ShopPage } from '@/components/ShopPage';
export default async function Page({searchParams}:{searchParams:Promise<{category?:string;collection?:string;query?:string}>}){const params=await searchParams;return <ShopPage initialCategory={params.category} initialCollection={params.collection} initialQuery={params.query}/>}
