'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from './StoreProvider';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useStore();

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
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="content-hero container">
        <span className="eyebrow">Your account</span>
        <h1 className="serif">Welcome back.</h1>
        <p>Sign in to track orders, save favourites and check out faster.</p>
      </div>
      <section className="content-body container">
        <div className="auth-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="error-banner mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center">
            New to Riz? <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
