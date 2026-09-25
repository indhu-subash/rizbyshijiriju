'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/components/StoreProvider';
import {
  LayoutDashboard,
  Gem,
  LayoutGrid,
  Layers,
  ShoppingBag,
  Ticket,
  Users,
  Truck,
  ArrowLeft,
  Loader2,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loadingAuth } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const menuItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
    { label: 'Collections', href: '/admin/collections', icon: Layers },
    { label: 'Products', href: '/admin/products', icon: Gem },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { label: 'Shipping Rates', href: '/admin/shipping', icon: Truck },
    { label: 'Customers', href: '/admin/customers', icon: Users },
  ];

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

  return (
    <div className="admin-container">
      {/* Mobile Navigation Header */}
      <header className="admin-mobile-header">
        <div className="admin-mobile-brand">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="admin-mobile-toggle"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="eyebrow-chip">Admin</span>
            <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--serif)' }}>Riz Portal</span>
          </div>
        </div>
        <Link href="/" className="admin-mobile-home-link" title="Return to storefront">
          <ArrowLeft size={18} />
        </Link>
      </header>

      {/* Mobile Dark Backdrop */}
      {mobileOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div className="brand-logo mb-8" style={{ borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>Management Console</span>
              <h2 className="serif text-xl font-semibold mt-1">Riz Portal</h2>
            </div>

            <nav style={{ display: 'grid', gap: '8px' }}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '6px',
                      color: isActive ? 'var(--accent)' : '#444',
                      background: isActive ? '#f7f6f0' : 'transparent',
                      fontWeight: isActive ? '500' : '400',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div style={{ paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm muted hover-accent"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Return to storefront</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
