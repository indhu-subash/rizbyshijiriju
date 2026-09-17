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
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loadingAuth } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

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
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: '#fcfcf9' }}>
      {/* Admin Sidebar */}
      <aside
        className="admin-sidebar border-r"
        style={{
          width: '260px',
          background: '#fff',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
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
                  className={`admin-nav-item flex items-center gap-3 p-3 rounded text-sm ${isActive ? 'active' : ''}`}
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

        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm muted hover-accent"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Return to storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
