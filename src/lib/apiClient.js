import axios from "axios";

/**
 * Vercel + Vite best practice:
 * - Prod: call same-origin serverless endpoints via "/api"
 * - Dev: if you run a local API server, use "http://localhost:3001/api"
 * - If you want to override, set VITE_API_BASE_URL in env (Vercel/Local)
 */
const DEFAULT_DEV_API = "http://localhost:3001/api";
const DEFAULT_PROD_API = "/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_API : DEFAULT_PROD_API);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ---- Helpers (optional) ----
// Supabase token storage keys vary; keep your old key for backward compatibility
const getAuthToken = () => {
  // Your previous key (keep)
  const legacy = localStorage.getItem("supabase.auth.token");
  if (legacy) return legacy;

  // If later you store your own token key, you can add it here.
  return null;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      const method = (config.method || "GET").toUpperCase();
      // axios baseURL + url
      console.log(`[API] ${method} ${config.baseURL || ""}${config.url || ""}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("[API] Request Error:", error?.message || error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] Response ${response.status}:`, response.data);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.error("[API] Response Error:", {
      status,
      message: error?.message,
      data,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      method: error?.config?.method,
    });

    // Handle common errors
    if (status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get products with filters and pagination
  getProducts: async (params = {}) => {
    const response = await apiClient.get("/products", { params });
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Search products (for navbar autocomplete)
  searchProducts: async (query, limit = 6) => {
    const response = await apiClient.get("/products/search", {
      params: { q: query, limit },
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
    const response = await apiClient.post("/profiles", profileData);
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
    const response = await apiClient.get("/orders", {
      params: { user_id: userId, ...params },
    });
    return response.data;
  },

  // Get single order
  getOrder: async (orderId, userId) => {
    const response = await apiClient.get(`/orders/${orderId}`, {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await apiClient.post("/orders", orderData);
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
  handleError: (error, defaultMessage = "An error occurred") => {
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMessage;
  },

  // Build query string from object
  buildQueryString: (params) => {
    const filtered = Object.entries(params || {})
      .filter(([_, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    return filtered ? `?${filtered}` : "";
  },

  // Check if API is healthy
  healthCheck: async () => {
    try {
      // If API_BASE_URL is "/api" => origin = "" ; else strip "/api"
      const origin =
        API_BASE_URL.startsWith("http") ? API_BASE_URL.replace(/\/api\/?$/, "") : "";
      const response = await axios.get(`${origin}/health`);
      return response.data;
    } catch (error) {
      console.error("[API] Health check failed:", error?.message || error);
      return { status: "ERROR", error: error?.message || String(error) };
    }
  },
};

export default apiClient;
