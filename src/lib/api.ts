/**
 * Orderwala API Client
 *
 * Centralized API service layer. All frontend components should use this
 * instead of raw fetch() calls. Handles auth tokens, error formatting,
 * and response normalization.
 *
 * Next.js API routes (/api/*) remain the primary data layer (Firebase Firestore).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  vendor?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
  featured?: boolean;
}

export interface OrderPayload {
  vendorId: string;
  items: {
    productId: string;
    quantity: number;
    variant?: string;
    price: number;
  }[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    lat: number;
    lng: number;
  };
  paymentMethod: 'razorpay' | 'cod' | 'wallet';
  promoCode?: string;
  specialInstructions?: string;
}

export interface AddressPayload {
  type: 'home' | 'work' | 'other';
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

// ---------------------------------------------------------------------------
// Base helpers
// ---------------------------------------------------------------------------

const BASE_URL = '';  // empty = same origin (Next.js API routes)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  useBackend = false,
): Promise<ApiResponse<T>> {
  const base = useBackend ? BACKEND_URL : BASE_URL;
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // If calling Express backend, attach JWT from localStorage (set at login)
  if (useBackend) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('orderwala_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();

    if (!res.ok) {
      throw new ApiError(json.error || json.message || 'Request failed', res.status);
    }

    return json as ApiResponse<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }
}

function get<T>(path: string, useBackend = false) {
  return request<T>(path, { method: 'GET' }, useBackend);
}

function post<T>(path: string, body: unknown, useBackend = false) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, useBackend);
}

function put<T>(path: string, body: unknown, useBackend = false) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, useBackend);
}

function patch<T>(path: string, body: unknown, useBackend = false) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, useBackend);
}

function del<T>(path: string, useBackend = false) {
  return request<T>(path, { method: 'DELETE' }, useBackend);
}

// ---------------------------------------------------------------------------
// Query-string builder
// ---------------------------------------------------------------------------

function toQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register(data: { name: string; email: string; phone: string; password: string }) {
    return post('/api/auth/register', data);
  },
  sendOtp(phone: string) {
    return post('/api/auth/send-otp', { phone });
  },
  verifyOtp(phone: string, otp: string) {
    return post('/api/auth/verify-otp', { phone, otp });
  },
  forgotPassword(email: string) {
    return post('/api/auth/forgot-password', { email });
  },
  verifyResetOtp(email: string, otp: string) {
    return post('/api/auth/verify-reset-otp', { email, otp });
  },
  resetPassword(token: string, password: string) {
    return post('/api/auth/reset-password', { token, password });
  },
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const productsApi = {
  list(filters: ProductFilters = {}) {
    return get(`/api/products${toQuery(filters as Record<string, unknown>)}`);
  },
  getById(id: string) {
    return get(`/api/products/${id}`);
  },
  create(data: Record<string, unknown>) {
    return post('/api/products', data);
  },
  update(id: string, data: Record<string, unknown>) {
    return put(`/api/products/${id}`, data);
  },
  delete(id: string) {
    return del(`/api/products/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesApi = {
  list(params: { isActive?: boolean } = {}) {
    return get(`/api/categories${toQuery(params as Record<string, unknown>)}`);
  },
};

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export const vendorsApi = {
  list(params: { page?: number; limit?: number; lat?: number; lng?: number; radius?: number } = {}) {
    return get(`/api/vendors${toQuery(params as Record<string, unknown>)}`);
  },
  getById(id: string) {
    return get(`/api/vendors/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersApi = {
  list(params: { page?: number; limit?: number; status?: string } = {}) {
    return get(`/api/orders${toQuery(params as Record<string, unknown>)}`);
  },
  getById(id: string) {
    return get(`/api/orders/${id}`);
  },
  create(payload: OrderPayload) {
    return post('/api/orders', payload);
  },
  updateStatus(id: string, status: string) {
    return patch(`/api/orders/${id}`, { status });
  },
  rate(id: string, data: { rating: number; review?: string }) {
    return post(`/api/orders/${id}/rate`, data);
  },
};

// ---------------------------------------------------------------------------
// Cart (server-synced)
// ---------------------------------------------------------------------------

export const cartApi = {
  get() {
    return get('/api/cart');
  },
  addItem(item: { productId: string; vendorId: string; quantity: number; variant?: string }) {
    return post('/api/cart', item);
  },
  updateItem(id: string, quantity: number) {
    return put(`/api/cart/${id}`, { quantity });
  },
  removeItem(id: string) {
    return del(`/api/cart/${id}`);
  },
  clear() {
    return del('/api/cart');
  },
};

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const addressesApi = {
  list() {
    return get('/api/addresses');
  },
  create(data: AddressPayload) {
    return post('/api/addresses', data);
  },
  update(id: string, data: Partial<AddressPayload>) {
    return put(`/api/addresses/${id}`, data);
  },
  delete(id: string) {
    return del(`/api/addresses/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export const favoritesApi = {
  list() {
    return get('/api/favorites');
  },
  add(vendorId: string) {
    return post('/api/favorites', { vendorId });
  },
  remove(vendorId: string) {
    return del(`/api/favorites/${vendorId}`);
  },
};

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

export const promosApi = {
  validate(code: string, orderTotal: number) {
    return post('/api/promo-codes/validate', { code, orderTotal });
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewsApi = {
  list(params: { productId?: string; vendorId?: string } = {}) {
    return get(`/api/reviews${toQuery(params as Record<string, unknown>)}`);
  },
  create(data: { orderId: string; productId: string; vendorId: string; rating: number; comment?: string }) {
    return post('/api/reviews', data);
  },
};

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export const offersApi = {
  list() {
    return get('/api/offers');
  },
};

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export const walletApi = {
  get() {
    return get('/api/wallet');
  },
};

// ---------------------------------------------------------------------------
// Delivery (partner endpoints)
// ---------------------------------------------------------------------------

export const deliveryApi = {
  dashboard() {
    return get('/api/delivery/dashboard');
  },
  nearbyOrders(lat: number, lng: number) {
    return get(`/api/delivery/nearby?lat=${lat}&lng=${lng}`);
  },
  orders() {
    return get('/api/delivery/orders');
  },
  earnings() {
    return get('/api/delivery/earnings');
  },
  onboarding(data: Record<string, unknown>) {
    return post('/api/delivery/onboarding', data);
  },
  updateProfile(data: Record<string, unknown>) {
    return put('/api/delivery/profile', data);
  },
};

// ---------------------------------------------------------------------------
// Seller / Vendor dashboard
// ---------------------------------------------------------------------------

export const sellerApi = {
  dashboard() {
    return get('/api/seller/dashboard');
  },
  analytics() {
    return get('/api/seller/analytics');
  },
  orders(params: { page?: number; limit?: number; status?: string } = {}) {
    return get(`/api/seller/orders${toQuery(params as Record<string, unknown>)}`);
  },
  updateOrder(id: string, data: Record<string, unknown>) {
    return patch(`/api/seller/orders/${id}`, data);
  },
  products(params: { page?: number; limit?: number } = {}) {
    return get(`/api/seller/products${toQuery(params as Record<string, unknown>)}`);
  },
  createProduct(data: Record<string, unknown>) {
    return post('/api/seller/products', data);
  },
  updateProduct(id: string, data: Record<string, unknown>) {
    return put(`/api/seller/products/${id}`, data);
  },
  deleteProduct(id: string) {
    return del(`/api/seller/products/${id}`);
  },
  store() {
    return get('/api/seller/store');
  },
  updateStore(data: Record<string, unknown>) {
    return put('/api/seller/store', data);
  },
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  login(email: string, password: string) {
    return post('/api/admin/login', { email, password });
  },
  stats() {
    return get('/api/admin/stats');
  },
  reports(params: { period?: string } = {}) {
    return get(`/api/admin/reports${toQuery(params as Record<string, unknown>)}`);
  },
  upload(formData: FormData) {
    // Special case: multipart/form-data (no JSON Content-Type)
    return fetch('/api/admin/upload', { method: 'POST', body: formData }).then(r => r.json());
  },
  // CRUD helpers
  categories: {
    list: ()              => get('/api/admin/categories'),
    create: (d: unknown)  => post('/api/admin/categories', d),
    update: (id: string, d: unknown) => put(`/api/admin/categories/${id}`, d),
    delete: (id: string)  => del(`/api/admin/categories/${id}`),
  },
  customers: {
    list: (p: Record<string, unknown> = {}) => get(`/api/admin/customers${toQuery(p)}`),
    getById: (id: string) => get(`/api/admin/customers/${id}`),
    update: (id: string, d: unknown) => put(`/api/admin/customers/${id}`, d),
  },
  products: {
    list: (p: Record<string, unknown> = {}) => get(`/api/admin/products${toQuery(p)}`),
    getById: (id: string) => get(`/api/admin/products/${id}`),
    update: (id: string, d: unknown) => put(`/api/admin/products/${id}`, d),
    delete: (id: string)  => del(`/api/admin/products/${id}`),
  },
  orders: {
    list: (p: Record<string, unknown> = {}) => get(`/api/admin/orders${toQuery(p)}`),
    getById: (id: string) => get(`/api/admin/orders/${id}`),
    update: (id: string, d: unknown) => put(`/api/admin/orders/${id}`, d),
  },
  vendors: {
    list: (p: Record<string, unknown> = {}) => get(`/api/admin/vendors${toQuery(p)}`),
    getById: (id: string) => get(`/api/admin/vendors/${id}`),
    update: (id: string, d: unknown) => put(`/api/admin/vendors/${id}`, d),
  },
  promos: {
    list: ()              => get('/api/admin/promos'),
    create: (d: unknown)  => post('/api/admin/promos', d),
    update: (id: string, d: unknown) => put(`/api/admin/promos/${id}`, d),
    delete: (id: string)  => del(`/api/admin/promos/${id}`),
  },
  delivery: {
    list: (p: Record<string, unknown> = {}) => get(`/api/admin/delivery${toQuery(p)}`),
    getById: (id: string) => get(`/api/admin/delivery/${id}`),
    update: (id: string, d: unknown) => put(`/api/admin/delivery/${id}`, d),
  },
};

// ---------------------------------------------------------------------------
// Real-time (Express backend + Socket.IO)
// ---------------------------------------------------------------------------

export const realtimeApi = {
  /**
   * Track a delivery order in real-time via WebSocket.
   * Requires NEXT_PUBLIC_BACKEND_URL to be set.
   */
  async connectSocket() {
    if (!BACKEND_URL) {
      console.warn('NEXT_PUBLIC_BACKEND_URL not set — real-time features disabled');
      return null;
    }
    const { io } = await import('socket.io-client');
    const token = typeof window !== 'undefined' ? localStorage.getItem('orderwala_token') : null;
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    return socket;
  },
};

// ---------------------------------------------------------------------------
// Convenience default export
// ---------------------------------------------------------------------------

const api = {
  auth: authApi,
  products: productsApi,
  categories: categoriesApi,
  vendors: vendorsApi,
  orders: ordersApi,
  cart: cartApi,
  addresses: addressesApi,
  favorites: favoritesApi,
  promos: promosApi,
  reviews: reviewsApi,
  offers: offersApi,
  wallet: walletApi,
  delivery: deliveryApi,
  seller: sellerApi,
  admin: adminApi,
  realtime: realtimeApi,
};

export default api;
