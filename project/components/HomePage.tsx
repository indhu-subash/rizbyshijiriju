'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, ShieldCheck, Sparkles, Truck, RefreshCw } from 'lucide-react';
import { categoriesList, products } from '@/data/products';
import { ProductGrid } from './ProductCard';
import { Newsletter } from './Newsletter';

const heroImage = '/hero-banner.png';

const featuredCollections = [
  [
    'Anti-Tarnish Collection',
    'Made for everyday shine, water-resistant & durable.',
    '/collections/anti-tarnish',
    'https://images.pexels.com/photos/29502912/pexels-photo-29502912.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Traditional Kerala Heritage',
    'Timeless Kerala-inspired royal elegance.',
    '/collections/traditional',
    'https://images.pexels.com/photos/38344601/pexels-photo-38344601.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Bridal & Celebration',
    'For grand moments that deserve to last forever.',
    '/collections/bridal',
    'https://images.pexels.com/photos/9901809/pexels-photo-9901809.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Silver Replica Statement',
    'High-grade silver finish statement craft.',
    '/collections/silver-replica',
    'https://images.pexels.com/photos/6256046/pexels-photo-6256046.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Diamond Replica Polish',
    'High Polish AD Diamond brilliance.',
    '/collections/diamond-replica',
    'https://images.pexels.com/photos/10907855/pexels-photo-10907855.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'AD Artistry Collection',
    'Intricate American Diamond design.',
    '/collections/ad-collections',
    'https://images.pexels.com/photos/30200528/pexels-photo-30200528.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
];

export function HomePage() {
  const antiTarnishItems = products.filter((p) => p.collection === 'Anti-Tarnish').slice(0, 4);
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 4);
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 4);

  return (
    <main className="homepage-root">
      {/* Standard Clean Editorial Hero Section */}
      <section className="hero-editorial">
        <div className="container hero-editorial-inner">
          <div className="hero-editorial-copy">
            <span className="eyebrow">TIMELESS JEWELLERY • MODERN WOMEN</span>
            <h1 className="serif">
              Elegance<br />
              in Every <i>Detail</i>
            </h1>
            <p>
              Beautifully crafted, anti-tarnish jewellery for your everyday and every special moment.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/shop">
                Shop Now <ArrowRight size={15} />
              </Link>
              <Link className="button secondary" href="/collections/anti-tarnish">
                Explore Collections
              </Link>
            </div>
            <div className="hero-signoff">
              <span /> Affordable luxury, made to live in
            </div>
          </div>
          <div className="hero-editorial-image">
            <Image
              src={heroImage}
              alt="Elegance in Every Detail - RIZ BY SHIJIRIJU"
              fill
              priority
              sizes="(max-width:640px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Brand Value Pillars Bar */}
      <section className="pillars-bar">
        <div className="container pillars-grid">
          <div className="pillar-item">
            <ShieldCheck size={20} className="pillar-icon" />
            <div>
              <strong>Anti-Tarnish Guaranteed</strong>
              <small>Water-resistant & everyday durable</small>
            </div>
          </div>
          <div className="pillar-item">
            <Sparkles size={20} className="pillar-icon" />
            <div>
              <strong>Kerala Craftsmanship</strong>
              <small>Heritage motifs reimagined for today</small>
            </div>
          </div>
          <div className="pillar-item">
            <Truck size={20} className="pillar-icon" />
            <div>
              <strong>Free Shipping over ₹2,000</strong>
              <small>Fast insured delivery across India</small>
            </div>
          </div>
          <div className="pillar-item">
            <RefreshCw size={20} className="pillar-icon" />
            <div>
              <strong>Easy 7-Day Returns</strong>
              <small>Hassle-free guarantee & support</small>
            </div>
          </div>
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
              <Image src={image} alt={title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
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
            <i className="serif-italic-accent">Reimagined.</i>
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
              <i className="serif-italic-accent">Effortlessly Refined.</i>
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

      <Newsletter />
    </main>
  );
}
