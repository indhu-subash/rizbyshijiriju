'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from './StoreProvider';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isAuthenticated, user } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login({ email, password });
      login(data.user);
      
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        // If they successfully logged in but aren't an admin
        setError('Unauthorized access. This area is restricted to administrators.');
        // We could theoretically log them out here if we wanted to enforce strictly
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in as admin, they shouldn't see this page
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.push('/admin');
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user?.role === 'admin') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fcfcf9', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#f7f6f0', color: 'var(--accent)', marginBottom: '16px' }}>
            <Shield size={28} />
          </div>
          <h1 className="serif" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Admin Portal</h1>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Secure access for staff and administrators.</p>
        </div>

        {error && (
          <div className="error-banner mb-6" style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
            Administrator Email
            <input
              required
              type="email"
              placeholder="admin@rizbyshijiriju.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #e5e5e5', width: '100%' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
            Password
            <div style={{ position: 'relative' }}>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ padding: '12px', paddingLeft: '38px', borderRadius: '6px', border: '1px solid #e5e5e5', width: '100%' }}
              />
              <Lock size={16} className="muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </label>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'var(--accent)', 
              color: 'white', 
              padding: '14px', 
              borderRadius: '6px', 
              border: 'none', 
              fontWeight: '500', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/" className="muted flex items-center justify-center gap-2" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowLeft size={16} />
            <span>Return to storefront</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
