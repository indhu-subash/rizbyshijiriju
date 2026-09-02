'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, UserRound, Heart, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useStore } from './StoreProvider';

const columns = [
  {
    title: 'Collections',
    links: [
      ['Anti-Tarnish', '/collections/anti-tarnish'],
      ['Traditional', '/collections/traditional'],
      ['Bridal', '/collections/bridal'],
      ["Men's", '/collections/mens'],
      ['Kids', '/collections/kids'],
      ['Hair Accessories', '/collections/hair-accessories'],
    ],
  },
  {
    title: 'Replica',
    links: [
      ['Silver Replica', '/collections/silver-replica'],
      ['Diamond Replica', '/collections/diamond-replica'],
      ['AD Collections', '/collections/ad-collections'],
    ],
  },
  {
    title: 'Fashion',
    links: [
      ['Fancy', '/collections/fancy'],
      ['Gold Covering & Micro Plated', '/collections/gold-covering-micro-plated'],
      ['RIZ House of Fashion', '/collections/riz-house-of-fashion'],
    ],
  },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const { cartCount, wishlist, isAuthenticated } = useStore();
  
  return (
    <>
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE ₹999 <span>·</span> EASY 7-DAY RETURNS
      </div>
      <header className="header">
        <div className="container header-inner">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <Link href="/" className="logo brand-mark">
            <Image src="/logo.png" alt="Riz by Shijiriju" width={76} height={58} />
          </Link>
          <nav className="desktop-nav">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <button
              className={`nav-dropdown ${mega ? 'active' : ''}`}
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega(!mega)}
              aria-expanded={mega}
            >
              Collections <ChevronDown size={13} />
            </button>
            <Link href="/new-arrivals">New arrivals</Link>
            <Link href="/best-sellers">Bestsellers</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <div className="header-actions">
            <Link href="/search" aria-label="Search">
              <Search size={19} />
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="action-badge">
              <Heart size={19} />
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </Link>
            <Link href={isAuthenticated ? "/account" : "/login"} aria-label="Account">
              <UserRound size={19} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="action-badge">
              <ShoppingBag size={19} />
              {cartCount > 0 && <b>{cartCount}</b>}
            </Link>
          </div>
        </div>
        {mega && (
          <div className="mega-menu" onMouseLeave={() => setMega(false)}>
            <div className="container mega-grid">
              {columns.map((column) => (
                <div key={column.title}>
                  <span className="eyebrow">{column.title}</span>
                  {column.links.map(([label, href]) => (
                    <Link key={`${column.title}-${label}`} href={href} onClick={() => setMega(false)}>
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mega-feature">
                <span className="eyebrow">Shop by category</span>
                <p className="serif">
                  The pieces<br />
                  <i>you’ll live in.</i>
                </p>
                <Link href="/shop" onClick={() => setMega(false)} className="text-link">
                  Explore all <ChevronDown size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
      {open && (
        <div className="mobile-drawer">
          <div className="drawer-top">
            <span className="logo brand-mark">
              <Image src="/image.png" alt="Riz by Shijiriju" width={92} height={70} />
            </span>
            <button aria-label="Close menu" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
          <nav>
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/shop" onClick={() => setOpen(false)}>Shop all</Link>
            <div className="drawer-section-title">Collections</div>
            <div className="drawer-section-links">
              <Link href="/collections/anti-tarnish" onClick={() => setOpen(false)}>Anti-tarnish</Link>
              <Link href="/collections/traditional" onClick={() => setOpen(false)}>Traditional</Link>
              <Link href="/collections/bridal" onClick={() => setOpen(false)}>Bridal</Link>
              <Link href="/collections/mens" onClick={() => setOpen(false)}>Men's Collection</Link>
              <Link href="/collections/kids" onClick={() => setOpen(false)}>Kids Collection</Link>
              <Link href="/collections/hair-accessories" onClick={() => setOpen(false)}>Hair Accessories</Link>
            </div>
            <div className="drawer-section-title">Replica</div>
            <div className="drawer-section-links">
              <Link href="/collections/silver-replica" onClick={() => setOpen(false)}>Silver Replica</Link>
              <Link href="/collections/diamond-replica" onClick={() => setOpen(false)}>Diamond Replica</Link>
              <Link href="/collections/ad-collections" onClick={() => setOpen(false)}>AD Collections</Link>
            </div>
            <div className="drawer-section-title">Fashion</div>
            <div className="drawer-section-links">
              <Link href="/collections/fancy" onClick={() => setOpen(false)}>Fancy</Link>
              <Link href="/collections/gold-covering-micro-plated" onClick={() => setOpen(false)}>Gold Covering & Micro Plated</Link>
              <Link href="/collections/riz-house-of-fashion" onClick={() => setOpen(false)}>RIZ House of Fashion</Link>
            </div>
            <div className="drawer-divider"></div>
            <Link href="/new-arrivals" onClick={() => setOpen(false)}>New arrivals</Link>
            <Link href="/about" onClick={() => setOpen(false)}>Our story</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          </nav>
          <div className="drawer-note">Affordable luxury, made to live in.</div>
        </div>
      )}
    </>
  );
}

