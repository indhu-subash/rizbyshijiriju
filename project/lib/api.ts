const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'An error occurred during the request.');
    }
    
    return data;
  } catch (error: any) {
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
  
  // Products
  products: {
    list: (params: { category?: string; collection?: string; query?: string; priceRange?: string; sort?: string } = {}) => {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.collection) queryParams.append('collection', params.collection);
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
  },

  // Checkout & Payments
  payments: {
    checkout: (body: { items: { productId: string; quantity: number }[]; shippingAddress: any; couponCode?: string; paymentMethod: string }) => 
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
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request('/admin/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getCoupons: () => request('/admin/coupons'),
    createCoupon: (body: any) => request('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
    editCoupon: (id: string, body: any) => request(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCoupon: (id: string) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getCustomers: () => request('/admin/customers'),
  }
};
