'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const QUICK_CATEGORIES = [
  { name: 'Necklaces', href: '/shop?category=Necklaces' },
  { name: 'Earrings', href: '/shop?category=Earrings' },
  { name: 'Rings', href: '/shop?category=Rings' },
  { name: 'Bangles', href: '/shop?category=Bangles' },
  { name: 'Bracelets', href: '/shop?category=Bracelets' },
  { name: 'Pendants', href: '/shop?category=Pendants' },
  { name: 'Anklets', href: '/shop?category=Anklets' },
  { name: 'Nose Pins', href: '/shop?category=Nose%20Pins' },
  { name: 'Chains', href: '/shop?category=Chains' },
  { name: 'Hair Accessories', href: '/shop?category=Hair%20Accessories' },
  { name: 'Jewellery Sets', href: '/shop?category=Jewellery%20Sets' },
];

function QuickCategoryItems() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams ? searchParams.get('category') : null;

  return (
    <div className="quick-category-scroll">
      {QUICK_CATEGORIES.map((cat) => {
        const isActive = currentCategory === cat.name;
        return (
          <Link
            key={cat.name}
            href={cat.href}
            className={`quick-category-item ${isActive ? 'active' : ''}`}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}

export function QuickCategoryStrip() {
  return (
    <div className="quick-category-strip">
      <div className="container quick-category-inner">
        <Suspense
          fallback={
            <div className="quick-category-scroll">
              {QUICK_CATEGORIES.map((cat) => (
                <Link key={cat.name} href={cat.href} className="quick-category-item">
                  {cat.name}
                </Link>
              ))}
            </div>
          }
        >
          <QuickCategoryItems />
        </Suspense>
      </div>
    </div>
  );
}
