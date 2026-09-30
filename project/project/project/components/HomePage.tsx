'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { categoriesList, products } from '@/data/products';
import { ProductGrid } from './ProductCard';
import { Newsletter } from './Newsletter';
import { api } from '@/lib/api';

const heroImage = '/hero-jewellery.jpg';

const featuredCollections = [
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
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1800&q=80',
  ],
];

export function HomePage() {
  const [antiTarnishItems, setAntiTarnishItems] = useState<any[]>([]);
  const [antiTarnishLoaded, setAntiTarnishLoaded] = useState<boolean>(false);
  const [antiTarnishError, setAntiTarnishError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    api.products
      .list({ collection: 'Anti-Tarnish' })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.products)) {
            setAntiTarnishItems(res.products.slice(0, 4));
            setAntiTarnishLoaded(true);
            setAntiTarnishError(false);
          } else {
            setAntiTarnishLoaded(false);
            setAntiTarnishError(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAntiTarnishLoaded(false);
          setAntiTarnishError(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedAntiTarnish = antiTarnishLoaded && !antiTarnishError
    ? antiTarnishItems
    : (antiTarnishError ? products.filter((p) => p.collection === 'Anti-Tarnish').slice(0, 4) : []);
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 4);
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 4);

  return (
    <main>
      {/* Editorial Hero Section */}
      <section className="hero-editorial">
        <div className="container hero-editorial-inner">
          <div className="hero-editorial-copy">
            <span className="eyebrow">KERALA HERITAGE · ANTI-TARNISH CRAFT</span>
            <h1 className="serif">
              Jewellery that keeps<br />
              <i>its glow, day after day.</i>
            </h1>
            <p>
              Thoughtfully crafted jewellery inspired by Kerala's timeless elegance — designed to become an enduring part of your daily style story.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/shop">
                Shop Now <ArrowRight size={15} />
              </Link>
              <Link className="button secondary" href="/about">
                Our Story
              </Link>
            </div>
            <div className="hero-signoff">
              <span /> Affordable luxury, made to live in
            </div>
          </div>
          <div className="hero-editorial-image">
            <Image
              src={heroImage}
              alt="RIZ BY SHIJIRIJU Editorial Jewellery Showcase"
              fill
              priority
              sizes="(max-width:640px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Featured Collections Grid */}
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">FIND YOUR KIND OF GLOW</span>
            <h2>Explore Our Collections</h2>
          </div>
          <p>Curated lines for everyday wear, wedding celebrations, and distinct statement looks.</p>
        </div>
        <div className="collection-editorial-grid">
          {featuredCollections.map(([title, description, href, image], i) => (
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

      {/* Anti-Tarnish Spotlight */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">THE EVERYDAY EDIT</span>
              <h2>Anti-Tarnish Collection</h2>
            </div>
            <Link className="text-link" href="/collections/anti-tarnish">
              Shop Anti-Tarnish <ArrowRight size={15} />
            </Link>
          </div>
          <p className="section-lede">Water-resistant, anti-tarnish jewellery built for continuous daily wear.</p>
          <ProductGrid items={displayedAntiTarnish} />
        </div>
      </section>

      {/* Split Feature: Traditional Collection */}
      <section className="split-feature container">
        <div className="split-feature-image">
          <Image
            src="/traditional-collection.png"
            alt="Traditional Kerala Jewellery Artistry"
            fill
            sizes="50vw"
          />
        </div>
        <div className="split-feature-copy">
          <span className="eyebrow">TRADITIONAL HERITAGE</span>
          <h2 className="serif">
            Kerala Craft,<br />
            <i>Reimagined.</i>
          </h2>
          <p>Pieces inspired by Kerala’s rich cultural legacy, gracefully reimagined for the modern connoisseur.</p>
          <Link href="/collections/traditional" className="button">
            Explore Traditional <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Just In / New Arrivals */}
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">NEW SEASON RELEASE</span>
            <h2>New Arrivals</h2>
          </div>
          <Link className="text-link" href="/new-arrivals">
            View All <ArrowRight size={15} />
          </Link>
        </div>
        <ProductGrid items={newArrivals} />
      </section>

      {/* Men's Feature Banner */}
      <section className="dark-feature">
        <div className="container dark-feature-inner">
          <div>
            <span className="eyebrow">FOR HIM</span>
            <h2 className="serif">
              Quietly Bold.<br />
              <i>Effortlessly Refined.</i>
            </h2>
            <p>Sleek rings, minimalist chains, and polished bracelets designed for effortless daily confidence.</p>
            <Link href="/collections/mens" className="button light">
              Shop Men's <ArrowRight size={15} />
            </Link>
          </div>
          <Image
            src="https://images.pexels.com/photos/8512143/pexels-photo-8512143.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Men's Jewellery Collection"
            fill
            sizes="50vw"
          />
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">MOST LOVED PIECES</span>
              <h2>Bestsellers</h2>
            </div>
            <Link className="text-link" href="/best-sellers">
              Shop Bestsellers <ArrowRight size={15} />
            </Link>
          </div>
          <ProductGrid items={bestsellers} />
        </div>
      </section>

      {/* Shop By Product Category */}
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">BROWSE BY TYPE</span>
            <h2>Shop By Category</h2>
          </div>
        </div>
        <div className="grid category-grid">
          {categoriesList.slice(0, 6).map((cat) => (
            <Link href={cat.href} className="category-card" key={cat.name}>
              <div className="category-image">
                <Image src={cat.image} alt={cat.name} fill sizes="(max-width:640px) 50vw, 16vw" />
              </div>
              <span>{cat.name}</span>
              <small>
                Explore <ArrowRight size={12} />
              </small>
            </Link>
          ))}
        </div>
      </section>

      {/* Customer Editorial Reviews */}
      <section className="reviews section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">THE RIZ EXPERIENCE</span>
            <h2>Client Reflections</h2>
          </div>
        </div>
        <div className="review-grid">
          {[
            ['“The finish and anti-tarnish coating are incredible. I wear my necklace every single day.”', 'Ananya, Bengaluru'],
            ['“Sophisticated Indian designs with a modern touch. The packaging felt like a bespoke luxury gift.”', 'Meera, Kochi'],
            ['“Top notch craftsmanship. The American Diamond replica shines exactly like real diamonds.”', 'Aditi, Mumbai'],
          ].map(([quote, name]) => (
            <div className="review" key={name}>
              <div className="stars">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <p className="serif">{quote}</p>
              <small>{name}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Wholesale Banner Spotlight */}
      <section className="wholesale-home-banner container">
        <div className="wholesale-home-banner-inner">
          <span className="eyebrow">WHOLESALE & STOCKIST ENQUIRIES</span>
          <h2 className="serif">Partner with RIZ by Shijiriju</h2>
          <p>
            Looking to offer our anti-tarnish everyday jewellery in your store or online catalogue? We welcome wholesale enquiries from retail stockists across India.
          </p>
          <Link href="/wholesale" className="button">
            Wholesale Enquiries <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
