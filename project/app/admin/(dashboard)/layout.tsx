'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/components/StoreProvider';
import {
  LayoutDashboard,
  Gem,
  LayoutGrid,
  ShoppingBag,
  Ticket,
  Users,
  Truck,
  ArrowLeft,
  Loader2,
  Lock,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loadingAuth } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loadingAuth) {
      if (!isAuthenticated) {
        router.push('/admin/login');
      } else if (user?.role !== 'admin') {
        router.push('/account');
      } else {
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, user, loadingAuth, router]);

  // Auto-close mobile menu on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loadingAuth || !authorized) {
    return (
      <div
        className="flex items-center justify-center min-h-screen gap-3"
        style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'center', alignItems: 'center' }}
      >
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--accent)' }} />
        <p className="muted">Verifying administrator credentials...</p>
      </div>
    );
  }

  const menuItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
    { label: 'Products', href: '/admin/products', icon: Gem },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { label: 'Shipping Rates', href: '/admin/shipping', icon: Truck },
    { label: 'Customers', href: '/admin/customers', icon: Users },
  ];

  return (
    <div className="admin-container">
      {/* Mobile Top Navigation Header (Visible < 768px) */}
      <header className="admin-mobile-header">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="admin-mobile-toggle"
          aria-label="Toggle admin navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="admin-mobile-brand">
          <span className="serif font-semibold text-lg">Riz Portal</span>
          <span className="eyebrow-chip">Admin</span>
        </div>
        <Link href="/" className="admin-mobile-home-link" title="Return to storefront">
          <ArrowLeft size={18} />
        </Link>
      </header>

      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar (Desktop Sticky + Mobile Drawer) */}
      <aside className={`admin-sidebar border-r ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand-logo mb-6 pb-4 border-b">
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>Management Console</span>
            <h2 className="serif text-xl font-semibold mt-1">Riz Portal</h2>
          </div>

          <nav style={{ display: 'grid', gap: '6px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item flex items-center gap-3 p-3 rounded text-sm ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 pt-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm muted hover-accent"
          >
            <ArrowLeft size={16} />
            <span>Return to storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
