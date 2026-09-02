'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '@/data/products';
import { api } from '@/lib/api';

export type CartItem = {
  product: Product;
  quantity: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
};

export type Store = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, n: number) => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  login: (u: User) => void;
  logout: () => void;
  loadingAuth: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Load cart, wishlist, and session on mount
  useEffect(() => {
    // 1. Load Local Storage
    try {
      setCart(JSON.parse(localStorage.getItem('riz-cart') || '[]'));
      setWishlist(JSON.parse(localStorage.getItem('riz-wishlist') || '[]'));
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }

    // 2. Fetch authenticated session from backend via httpOnly Cookie
    const fetchSession = async () => {
      try {
        const data = await api.auth.me();
        if (data && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // No active session is normal for guests
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    fetchSession();
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('riz-cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to local storage
  useEffect(() => {
    localStorage.setItem('riz-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const value = useMemo<Store>(() => {
    return {
      cart,
      wishlist,
      addToCart: (product: Product) =>
        setCart((items) =>
          items.some((item) => item.product.id === product.id)
            ? items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [...items, { product, quantity: 1 }]
        ),
      removeFromCart: (id: string) =>
        setCart((items) => items.filter((item) => item.product.id !== id)),
      updateQuantity: (id: string, n: number) =>
        setCart((items) =>
          items.map((item) =>
            item.product.id === id ? { ...item, quantity: Math.max(1, n) } : item
          )
        ),
      toggleWishlist: (id: string) =>
        setWishlist((items) =>
          items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
        ),
      clearCart: () => setCart([]),
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      
      // Auth Handlers
      user,
      isAuthenticated,
      login: (u: User) => {
        setUser(u);
        setIsAuthenticated(true);
      },
      logout: () => {
        setUser(null);
        setIsAuthenticated(false);
      },
      loadingAuth,
    };
  }, [cart, wishlist, user, isAuthenticated, loadingAuth]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('StoreProvider missing');
  return value;
};
