const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rizbyshijiriju-production-2116.up.railway.app/api';
// Force overwrite of any stale Railway production URLs without -2116
const API_URL = RAW_API_URL.replace(/rizbyshijiriju-production\.up\.railway\.app/g, 'rizbyshijiriju-production-2116.up.railway.app');

export const AUTH_TOKEN_KEY = 'riz_auth_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    // Ignore storage errors
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  // Ensure cookies are sent and received
  options.credentials = 'include';

  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && typeof token === 'string' && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  options.headers = headers;

  try {
    const res = await fetch(url, options);

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (!res.ok) {
        if (res.status === 401) {
          setStoredToken(null);
        }
        throw new Error(`Server returned ${res.status}: ${res.statusText || 'Error'}`);
      }
      data = { text };
    }

    if (!res.ok) {
      if (res.status === 401) {
        setStoredToken(null);
      }
      throw new Error(data.error || 'An error occurred during the request.');
    }

    return data;
  } catch (error: any) {
    // A 401 from /auth/me simply means the visitor is not logged in.
    // This is normal and should not be treated as a frontend error.
    if (endpoint === '/auth/me' && error?.message === 'Authentication required. No token provided.') {
      throw error;
    }

    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    register: async (body: any) => {
      const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
      if (data && data.token) {
        setStoredToken(data.token);
      }
      return data;
    },
    login: async (body: any) => {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
      if (data && data.token) {
        setStoredToken(data.token);
      }
      return data;
    },
    logout: async () => {
      try {
        return await request('/auth/logout', { method: 'POST' });
      } finally {
        setStoredToken(null);
      }
    },
    me: () => request('/auth/me'),
    getAddresses: () => request('/auth/addresses'),
    addAddress: (body: any) => request('/auth/addresses', { method: 'POST', body: JSON.stringify(body) }),
    deleteAddress: (id: string) => request(`/auth/addresses/${id}`, { method: 'DELETE' }),
  },

  // Categories
  categories: {
    list: () => request('/categories'),
    active: () => request('/categories/active'),
  },

  // Products
  products: {
    list: (params: { category?: string; collection?: string; color?: string; query?: string; priceRange?: string; sort?: string } = {}) => {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.collection) queryParams.append('collection', params.collection);
      if (params.color) queryParams.append('color', params.color);
      if (params.query) queryParams.append('query', params.query);
      if (params.priceRange) queryParams.append('priceRange', params.priceRange);
      if (params.sort) queryParams.append('sort', params.sort);

      const queryString = queryParams.toString();
      return request(`/products${queryString ? `?${queryString}` : ''}`);
    },
    getBySlug: (slug: string) => request(`/products/slug/${slug}`),
    getById: (id: string) => request(`/products/${id}`),
  },

  // Orders & Shipping
  orders: {
    my: () => request('/orders/my'),
    detail: (id: string) => request(`/orders/detail/${id}`),
    track: (orderId: string) => request(`/orders/track/${orderId}`),
    checkShipping: (pincode: string) => request(`/orders/shipping/pincode/${pincode}`),
    calculateShipping: (body: { country?: string; pincode?: string; postalCode?: string; city?: string; state?: string; district?: string }) =>
      request('/shipping/calculate', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Checkout & Payments
  payments: {
    checkout: (body: { items: { productId: string; quantity: number; color?: string | null }[]; shippingAddress: any; couponCode?: string; paymentMethod: string; manualShippingCharge?: number }) =>
      request('/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),
    verify: (body: { orderId: string; razorpayPaymentId?: string; razorpayOrderId?: string; razorpaySignature?: string }) =>
      request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
    cancel: (body: { orderId: string }) =>
      request('/payments/cancel', { method: 'POST', body: JSON.stringify(body) }),
  },


  // Admin Operations
  admin: {
    getStats: () => request('/admin/stats'),
    getOrders: (status?: string, query?: string) => {
      const q = new URLSearchParams();
      if (status) q.append('status', status);
      if (query) q.append('query', query);
      const str = q.toString();
      return request(`/admin/orders${str ? `?${str}` : ''}`);
    },
    updateOrderStatus: (id: string, body: { orderStatus: string; trackingNumber?: string }) =>
      request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    getProducts: (params: { category?: string; collection?: string; query?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.category) q.append('category', params.category);
      if (params.collection) q.append('collection', params.collection);
      if (params.query) q.append('query', params.query);
      const str = q.toString();
      return request(`/admin/products${str ? `?${str}` : ''}`);
    },
    createProduct: (body: any) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
    seedProducts: () => request('/admin/products/seed', { method: 'POST' }),
    editProduct: (id: string, body: any) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateProductStock: (id: string, stock: number) =>
      request(`/admin/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      }),
    deleteProduct: (id: string) => request(`/admin/products/${id}`, { method: 'DELETE' }),

    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request('/admin/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getCategories: async () => {
      try {
        return await request('/admin/categories');
      } catch (err) {
        try {
          return await request('/categories');
        } catch (err2) {
          return { categories: [] };
        }
      }
    },
    createCategory: async (body: any) => {
      try {
        return await request('/admin/categories', { method: 'POST', body: JSON.stringify(body) });
      } catch (err) {
        return await request('/categories', { method: 'POST', body: JSON.stringify(body) });
      }
    },
    editCategory: async (id: string, body: any) => {
      try {
        return await request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } catch (err) {
        return await request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
    },
    deleteCategory: async (id: string) => {
      try {
        return await request(`/admin/categories/${id}`, { method: 'DELETE' });
      } catch (err) {
        return await request(`/categories/${id}`, { method: 'DELETE' });
      }
    },
    seedCategories: async () => {
      try {
        return await request('/admin/categories/seed', { method: 'POST' });
      } catch (err) {
        return await request('/categories/seed', { method: 'POST' });
      }
    },
    // Collections
    getCollections: async () => {
      try {
        return await request('/collections/admin/all');
      } catch (err) {
        return await request('/collections');
      }
    },
    createCollection: (body: any) => request('/collections', { method: 'POST', body: JSON.stringify(body) }),
    updateCollection: (id: string, body: any) => request(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    toggleCollectionActive: (id: string) => request(`/collections/${id}/toggle`, { method: 'PATCH' }),
    deleteCollection: (id: string) => request(`/collections/${id}`, { method: 'DELETE' }),
    seedCollections: () => request('/collections/seed', { method: 'GET' }),

    getCoupons: () => request('/admin/coupons'),
    createCoupon: (body: any) => request('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
    editCoupon: (id: string, body: any) => request(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCoupon: (id: string) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getCustomers: () => request('/admin/customers'),
    getShippingRules: () => request('/admin/shipping-rules'),
    createShippingRule: (body: any) => request('/admin/shipping-rules', { method: 'POST', body: JSON.stringify(body) }),
    editShippingRule: (id: string, body: any) => request(`/admin/shipping-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteShippingRule: (id: string) => request(`/admin/shipping-rules/${id}`, { method: 'DELETE' }),
  },
};
