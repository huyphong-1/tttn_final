import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status}:`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('[API] Response Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get products with filters and pagination
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Search products (for navbar autocomplete)
  searchProducts: async (query, limit = 6) => {
    const response = await apiClient.get('/products/search', {
      params: { q: query, limit }
    });
    return response.data;
  },
};

// Profiles API
export const profilesApi = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await apiClient.get(`/profiles/${userId}`);
    return response.data;
  },

  // Create user profile
  createProfile: async (profileData) => {
    const response = await apiClient.post('/profiles', profileData);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, updateData) => {
    const response = await apiClient.put(`/profiles/${userId}`, updateData);
    return response.data;
  },

  // Update last login timestamp
  updateLastLogin: async (userId) => {
    const response = await apiClient.post(`/profiles/${userId}/last-login`);
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  // Get user orders
  getOrders: async (userId, params = {}) => {
    const response = await apiClient.get('/orders', {
      params: { user_id: userId, ...params }
    });
    return response.data;
  },

  // Get single order
  getOrder: async (orderId, userId) => {
    const response = await apiClient.get(`/orders/${orderId}`, {
      params: userId ? { user_id: userId } : {}
    });
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    const response = await apiClient.put(`/orders/${orderId}/status`, statusData);
    return response.data;
  },

  // Get order statistics
  getOrderStats: async (userId) => {
    const response = await apiClient.get(`/orders/stats/${userId}`);
    return response.data;
  },
};

// Generic API utilities
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return defaultMessage;
  },

  // Build query string from object
  buildQueryString: (params) => {
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return filtered ? `?${filtered}` : '';
  },

  // Check if API is healthy
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      console.error('[API] Health check failed:', error);
      return { status: 'ERROR', error: error.message };
    }
  },
};

export default apiClient;
