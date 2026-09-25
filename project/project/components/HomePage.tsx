'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { categoriesList, products } from '@/data/products';
import { ProductGrid } from './ProductCard';
import { Newsletter } from './Newsletter';

const heroImage = 'https://images.pexels.com/photos/29502932/pexels-photo-29502932.jpeg?auto=compress&cs=tinysrgb&w=1800';

const featuredCollections = [
  [
    'Anti-Tarnish',
    'Made for everyday shine & durability.',
    '/collections/anti-tarnish',
    'https://images.pexels.com/photos/29502912/pexels-photo-29502912.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Traditional',
    'Timeless Kerala-inspired elegance.',
    '/collections/traditional',
    'https://images.pexels.com/photos/38344601/pexels-photo-38344601.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Bridal',
    'For moments that deserve to last forever.',
    '/collections/bridal',
    'https://images.pexels.com/photos/9901809/pexels-photo-9901809.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Silver Replica',
    'High-grade silver finish statement pieces.',
    '/collections/silver-replica',
    'https://images.pexels.com/photos/6256046/pexels-photo-6256046.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Diamond Replica',
    'High polish diamond replica brilliance.',
    '/collections/diamond-replica',
    'https://images.pexels.com/photos/10907855/pexels-photo-10907855.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'AD Collections',
    'Intricate American Diamond artistry.',
    '/collections/ad-collections',
    'https://images.pexels.com/photos/30200528/pexels-photo-30200528.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    "Men's Collection",
    'Quietly bold. Effortlessly refined.',
    '/collections/mens',
    'https://images.pexels.com/photos/8512143/pexels-photo-8512143.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Kids Collection',
    'Delicate treasures for little celebrations.',
    '/collections/kids',
    'https://images.pexels.com/photos/37601638/pexels-photo-37601638.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'RIZ House of Fashion',
    'Exclusive signature house creations.',
    '/collections/riz-house-of-fashion',
    'https://images.pexels.com/photos/29502932/pexels-photo-29502932.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
];

export function HomePage() {
  const antiTarnishItems = products.filter((p) => p.collection === 'Anti-Tarnish').slice(0, 4);
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
          <ProductGrid items={antiTarnishItems} />
        </div>
      </section>

      {/* Split Feature: Traditional Collection */}
      <section className="split-feature container">
        <div className="split-feature-image">
          <Image
            src="https://images.pexels.com/photos/38344601/pexels-photo-38344601.jpeg?auto=compress&cs=tinysrgb&w=1100"
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

      {/* Wholesale Banner */}
      <section className="wholesale-home-banner section container">
        <div className="wholesale-home-card">
          <span className="eyebrow">PARTNER WITH US</span>
          <h2 className="serif">Wholesale with RIZ</h2>
          <p>Interested in stocking RIZ by Shijiriju? Get in touch with us for wholesale enquiries.</p>
          <Link href="/wholesale" className="button secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            Wholesale Enquiries <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
