import Image from 'next/image';
import { ProductGrid } from './ProductCard';
import { products as localProducts } from '@/data/products';

export function CollectionPage({
  title,
  description,
  filter,
  image,
  items,
}: {
  title: string;
  description: string;
  filter?: (p: typeof localProducts[number]) => boolean;
  image: string;
  items?: any[];
}) {
  const displayItems = items && items.length > 0 ? items : filter ? localProducts.filter(filter) : localProducts;
  return (
    <main>
      <div className="collection-hero">
        <Image src={image} alt={title} fill sizes="100vw" priority />
        <div className="collection-overlay" />
        <div className="container collection-heading">
          <span className="eyebrow">Riz by Shijiriju</span>
          <h1 className="serif">{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">The edit</span>
            <h2>Shop the collection</h2>
          </div>
          <span className="muted">{displayItems.length} pieces</span>
        </div>
        <ProductGrid items={displayItems} />
      </section>
    </main>
  );
}
