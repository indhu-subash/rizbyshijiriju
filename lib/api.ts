const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rizbyshijiriju-production-2116.up.railway.app/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  // Ensure cookies are sent and received
  options.credentials = 'include';

  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  try {
    const res = await fetch(url, options);

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        data = {};
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText || 'Endpoint Not Found'}`);
      }
      data = { text };
    }

    if (!res.ok) {
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
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    getAddresses: () => request('/auth/addresses'),
    addAddress: (body: any) => request('/auth/addresses', { method: 'POST', body: JSON.stringify(body) }),
    deleteAddress: (id: string) => request(`/auth/addresses/${id}`, { method: 'DELETE' }),
  },

  // Categories
  categories: {
    list: async () => {
      try {
        return await request('/categories');
      } catch (err) {
        try {
          return await request('/admin/categories');
        } catch (err2) {
          return { categories: [] };
        }
      }
    },
    active: async () => {
      try {
        return await request('/categories/active');
      } catch (err) {
        return { categories: [] };
      }
    },
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
    calculateShipping: async (body: { country?: string; pincode?: string; postalCode?: string; city?: string; state?: string; district?: string }) => {
      // Primary Attempt: /shipping/calculate
      try {
        return await request('/shipping/calculate', { method: 'POST', body: JSON.stringify(body) });
      } catch (err: any) {
        // Fallback 1: Try /orders/shipping/calculate
        try {
          return await request('/orders/shipping/calculate', { method: 'POST', body: JSON.stringify(body) });
        } catch (err2: any) {
          const cleanPin = (body.pincode || body.postalCode || '').trim();
          const isInd = !body.country || body.country === 'IN' || body.country.toLowerCase() === 'india';

          // Fallback 2: For India pincodes, attempt /orders/shipping/pincode/:pincode
          if (isInd && cleanPin && cleanPin.length === 6 && !isNaN(Number(cleanPin))) {
            try {
              const pinRes = await request(`/orders/shipping/pincode/${cleanPin}`);
              return {
                available: pinRes.available ?? true,
                shippingCharge: pinRes.shippingCharge ?? 0,
                estimate: pinRes.estimate || '3–5 working days',
                destination: {
                  city: pinRes.city,
                  district: pinRes.district,
                  state: pinRes.state,
                  country: 'India',
                },
                source: pinRes.source || 'pincode_rule',
                error: pinRes.error,
              };
            } catch (pinErr) {
              // Ignore API network failure and fall through to default India response
            }

            // Fallback 2b: Standard India default shipping response if API is unreachable/CORS blocked
            return {
              available: true,
              shippingCharge: 0,
              estimate: '3–5 working days',
              destination: {
                city: body.city || '',
                state: body.state || '',
                country: 'India',
              },
              source: 'india_default',
            };
          }

          // Fallback 3: Standard International response if API is unreachable/CORS blocked
          return {
            available: true,
            shippingCharge: 1500,
            estimate: '7–12 working days',
            destination: {
              country: body.country || 'International',
              city: body.city || '',
              state: body.state || '',
            },
            source: 'international_default',
          };
        }
      }
    },
  },

  // Checkout & Payments
  payments: {
    checkout: (body: { items: { productId: string; quantity: number; color?: string | null }[]; shippingAddress: any; couponCode?: string; paymentMethod: string; manualShippingCharge?: number }) =>
      request('/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),
    verify: (body: { orderId: string; razorpayPaymentId?: string; razorpayOrderId?: string; razorpaySignature?: string }) =>
      request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
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
    createProduct: (body: any) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
    editProduct: (id: string, body: any) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteProduct: (id: string) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    uploadImage: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        return await request('/admin/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.warn('Backend upload failed, converting file to Base64 Data URL fallback:', err);
        return new Promise<{ url: string; imageUrl: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = (reader.result as string) || '';
            resolve({ url: result, imageUrl: result });
          };
          reader.readAsDataURL(file);
        });
      }
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
    createCategory: (body: any) => request('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
    editCategory: (id: string, body: any) => request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCategory: (id: string) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
    seedCategories: () => request('/admin/categories/seed', { method: 'POST' }),
    getCoupons: () => request('/admin/coupons'),
    createCoupon: (body: any) => request('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
    editCoupon: (id: string, body: any) => request(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCoupon: (id: string) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getCustomers: () => request('/admin/customers'),
    getShippingRules: async () => {
      try {
        return await request('/admin/shipping-rules');
      } catch (err) {
        return { rules: [] };
      }
    },
    createShippingRule: (body: any) => request('/admin/shipping-rules', { method: 'POST', body: JSON.stringify(body) }),
    editShippingRule: (id: string, body: any) => request(`/admin/shipping-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteShippingRule: (id: string) => request(`/admin/shipping-rules/${id}`, { method: 'DELETE' }),
  },
};
