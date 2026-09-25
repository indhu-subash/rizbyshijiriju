'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, UserRound, Heart, ShoppingBag, X, ChevronDown, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStore } from './StoreProvider';
import { QuickCategoryStrip } from './QuickCategoryStrip';

const columns = [
  {
    title: 'COLLECTIONS',
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
    title: 'REPLICA',
    links: [
      ['Silver Replica', '/collections/silver-replica'],
      ['Diamond Replica', '/collections/diamond-replica'],
      ['AD Collections', '/collections/ad-collections'],
    ],
  },
  {
    title: 'FASHION',
    links: [
      ['Fancy', '/collections/fancy'],
      ['Gold Covering & Micro Plated', '/collections/gold-covering-micro-plated'],
      ['RIZ House of Fashion', '/collections/riz-house-of-fashion'],
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('COLLECTIONS');
  const { cartCount, wishlist, isAuthenticated } = useStore();

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  return (
    <>
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE ₹2,000 <span>·</span> EASY 7-DAY RETURNS
      </div>
      <header className="header">
        <div className="container header-inner">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>

          <Link href="/" className="logo brand-mark">
            <Image src="/logo.png" alt="Riz by Shijiriju" width={76} height={58} priority />
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
              Collections <ChevronDown size={13} style={{ marginLeft: 4 }} />
            </button>
            <Link href="/new-arrivals">New Arrivals</Link>
            <Link href="/best-sellers">Bestsellers</Link>
            <Link href="/wholesale">Wholesale</Link>
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
            <Link href={isAuthenticated ? '/account' : '/login'} aria-label="Account">
              <UserRound size={19} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="action-badge">
              <ShoppingBag size={19} />
              {cartCount > 0 && <b>{cartCount}</b>}
            </Link>
          </div>
        </div>

        {/* 3-Column Collection Mega Menu */}
        {mega && (
          <div className="mega-menu" onMouseLeave={() => setMega(false)}>
            <div className="container mega-grid">
              {columns.map((column) => (
                <div key={column.title} className="mega-column">
                  <span className="eyebrow mega-column-title">{column.title}</span>
                  <div className="mega-links-list">
                    {column.links.map(([label, href]) => (
                      <Link key={`${column.title}-${label}`} href={href} onClick={() => setMega(false)}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mega-feature">
                <span className="eyebrow">EDITORIAL SELECTION</span>
                <p className="serif">
                  The pieces<br />
                  <i>you’ll live in.</i>
                </p>
                <Link href="/shop" onClick={() => setMega(false)} className="text-link">
                  Explore all <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Quick Product Type Navigation Strip */}
      <QuickCategoryStrip />

      {/* Mobile Drawer & Overlay Backdrop */}
      {open && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="mobile-drawer">
            <div className="drawer-top">
              <Link href="/" className="logo brand-mark" onClick={() => setOpen(false)}>
                <Image src="/logo.png" alt="Riz by Shijiriju" width={76} height={58} />
              </Link>
              <button aria-label="Close menu" className="drawer-close-btn" onClick={() => setOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <nav className="mobile-nav">
              <Link href="/" onClick={() => setOpen(false)} className="mobile-nav-main">
                Home
              </Link>
              <Link href="/shop" onClick={() => setOpen(false)} className="mobile-nav-main">
                Shop All
              </Link>

              <div className="mobile-accordion-wrapper">
                {columns.map((column) => {
                  const isExpanded = expandedSection === column.title;
                  return (
                    <div key={column.title} className="mobile-accordion-group">
                      <button
                        className="mobile-accordion-header"
                        onClick={() => toggleSection(column.title)}
                      >
                        <span>{column.title}</span>
                        <ChevronDown
                          size={16}
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                          }}
                        />
                      </button>
                      {isExpanded && (
                        <div className="mobile-accordion-content">
                          {column.links.map(([label, href]) => (
                            <Link key={label} href={href} onClick={() => setOpen(false)}>
                              {label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="drawer-divider" />
              <Link href="/new-arrivals" onClick={() => setOpen(false)} className="mobile-nav-sub">
                New Arrivals
              </Link>
              <Link href="/best-sellers" onClick={() => setOpen(false)} className="mobile-nav-sub">
                Bestsellers
              </Link>
              <Link href="/wholesale" onClick={() => setOpen(false)} className="mobile-nav-sub">
                Wholesale
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className="mobile-nav-sub">
                Our Story
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="mobile-nav-sub">
                Contact
              </Link>
            </nav>

            <div className="drawer-footer">
              <p>Affordable luxury, made to live in.</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
