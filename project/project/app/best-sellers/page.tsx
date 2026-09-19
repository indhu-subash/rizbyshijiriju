import { CollectionPage } from '@/components/CollectionPage';
export default function Page(){return <CollectionPage title="Best sellers" description="The pieces you reach for, gift often and keep forever." filter={p=>Boolean(p.bestseller)} image="https://images.pexels.com/photos/10907855/pexels-photo-10907855.jpeg?auto=compress&cs=tinysrgb&w=1800"/>}
