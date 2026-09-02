import { CollectionPage } from '@/components/CollectionPage';
export default function Page(){return <CollectionPage title="New arrivals" description="Fresh pieces for the chapters you’re stepping into." filter={p=>Boolean(p.newArrival)} image="https://images.pexels.com/photos/29502969/pexels-photo-29502969.jpeg?auto=compress&cs=tinysrgb&w=1800"/>}
