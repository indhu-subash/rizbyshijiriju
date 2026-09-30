import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const allCollections = [
  [
    'Anti-Tarnish',
    'Made for everyday shine & durability.',
    '/collections/anti-tarnish',
    '/anti-tarnish-collection.jpg',
  ],
  [
    'Traditional',
    'Timeless Kerala-inspired elegance.',
    '/collections/traditional',
    '/traditional-collection.png',
  ],
  [
    'Bridal',
    'For moments that deserve to last forever.',
    '/collections/bridal',
    '/bridal-collection.png',
  ],
  [
    'Silver Replica',
    'High-grade silver finish statement pieces.',
    '/collections/silver-replica',
    '/silver-replica-collection.png',
  ],
  [
    'Diamond Replica',
    'High polish diamond replica brilliance.',
    '/collections/diamond-replica',
    '/diamond-replica-collection.jpg',
  ],
  [
    'AD Collections',
    'Intricate American Diamond artistry.',
    '/collections/ad-collections',
    '/ad-collection.jpg',
  ],
  [
    "Men's Collection",
    'Quietly bold. Effortlessly refined.',
    '/collections/mens',
    '/mens-collection.png',
  ],
  [
    'Kids Collection',
    'Delicate treasures for little celebrations.',
    '/collections/kids',
    '/kids-collection.jpg',
  ],
  [
    'RIZ House of Fashion',
    'Exclusive signature house creations.',
    '/collections/riz-house-of-fashion',
    '/riz-house-of-fashion.jpg',
  ],
  [
    'Watches Collection',
    'Luxury and everyday watches collection.',
    '/collections/watches',
    '/watches-collection.png',
  ],
];

export const metadata = {
  title: 'Explore Our Collections | RIZ BY SHIJIRIJU',
  description: 'Browse all 10 curated jewellery and watches collections from RIZ BY SHIJIRIJU.',
};

export default function CollectionsPage() {
  return (
    <main style={{ paddingBottom: '60px' }}>
      <section className="section container" style={{ paddingTop: '40px' }}>
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div>
            <span className="eyebrow">FIND YOUR KIND OF GLOW</span>
            <h1 className="serif" style={{ fontSize: '2.2rem', fontWeight: 600, marginTop: '4px' }}>
              Explore Our Collections
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: '600px' }}>
            Curated lines for everyday wear, wedding celebrations, and distinct statement looks.
          </p>
        </div>

        <div className="collection-editorial-grid">
          {allCollections.map(([title, description, href, image], i) => (
            <Link href={href} className={`collection-editorial-card card-${i}`} key={title}>
              <Image src={image} alt={title} fill sizes="(max-width:640px) 50vw, 25vw" />
              <div className="collection-card-shade" />
              <div className="collection-card-copy">
                <span>{title}</span>
                <small>{description}</small>
                <b>
                  Explore Collection <ArrowRight size={13} />
                </b>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
