'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '@/data/products';
import { api } from '@/lib/api';

export type CartItem = {
  product: Product;
  quantity: number;
  color?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
};

export type ToastNotification = {
  id: number;
  message: string;
  type: 'cart' | 'wishlist';
  productName?: string;
  image?: string;
};

export type Store = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (p: Product, quantity?: number, color?: string) => void;
  removeFromCart: (id: string, color?: string) => void;
  updateQuantity: (id: string, color: string | undefined, n: number) => void;
  toggleWishlist: (id: string, product?: Product) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  login: (u: User) => void;
  logout: () => void;
  loadingAuth: boolean;

  // Toast System
  toast: ToastNotification | null;
  closeToast: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Toast State
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: 'cart' | 'wishlist', productName?: string, image?: string) => {
    setToast({ id: Date.now(), message, type, productName, image });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load cart, wishlist, and session on mount
  useEffect(() => {
    try {
      const rawCart = JSON.parse(localStorage.getItem('riz-cart') || '[]');
      const parsedCart: CartItem[] = Array.isArray(rawCart)
        ? rawCart.map((item: any) => ({
            product: item.product,
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
            color: item.color || undefined,
          }))
        : [];
      setCart(parsedCart);
      setWishlist(JSON.parse(localStorage.getItem('riz-wishlist') || '[]'));
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }

    const fetchSession = async () => {
      try {
        const data = await api.auth.me();
        if (data && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
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
      addToCart: (product: Product, quantity: number = 1, color?: string) => {
        setCart((items) => {
          const targetColor = color || undefined;
          const index = items.findIndex(
            (item) => item.product.id === product.id && (item.color || undefined) === targetColor
          );
          if (index !== -1) {
            return items.map((item, i) =>
              i === index ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [...items, { product, quantity, color: targetColor }];
        });
        showToast('Item added to cart', 'cart', product.name, product.images?.[0]);
      },
      removeFromCart: (id: string, color?: string) =>
        setCart((items) =>
          items.filter(
            (item) => !(item.product.id === id && (item.color || undefined) === (color || undefined))
          )
        ),
      updateQuantity: (id: string, color: string | undefined, n: number) =>
        setCart((items) =>
          items.map((item) =>
            item.product.id === id && (item.color || undefined) === (color || undefined)
              ? { ...item, quantity: Math.max(1, n) }
              : item
          )
        ),
      toggleWishlist: (id: string, product?: Product) => {
        setWishlist((items) => {
          const exists = items.includes(id);
          if (exists) {
            showToast('Item removed from wishlist', 'wishlist', product?.name);
            return items.filter((item) => item !== id);
          } else {
            showToast('Item added to wishlist', 'wishlist', product?.name, product?.images?.[0]);
            return [...items, id];
          }
        });
      },
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

      // Toast System
      toast,
      closeToast: () => setToast(null),
    };
  }, [cart, wishlist, user, isAuthenticated, loadingAuth, toast]);

  return (
    <StoreContext.Provider value={value}>
      {children}

      {/* Global Toast Notification Popup */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.image && <img src={toast.image} alt={toast.productName || 'Product'} className="toast-img" />}
          <div className="toast-text">
            <strong>{toast.type === 'cart' ? 'Shopping Bag' : 'Wishlist'}</strong>
            <span>{toast.message}{toast.productName ? `: ${toast.productName}` : ''}</span>
          </div>
          <button onClick={() => setToast(null)} className="toast-close" aria-label="Close notification">✕</button>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('StoreProvider missing');
  return value;
};

