import { ShopPage } from '@/components/ShopPage';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const params=await searchParams;return <ShopPage initialQuery={params.q}/>}
