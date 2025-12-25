import { supabase } from '../lib/supabase';
import { PERMISSIONS, hasPermission } from '../config/permissions';

// Base API service class
class ApiService {
  constructor() {
    this.client = supabase;
  }

  // Check user permission before API call
  async checkPermission(requiredPermission) {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized: User not logged in');
    }

    const { data: profile } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'guest';
    
    if (!hasPermission(userRole, requiredPermission)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    return { user, userRole };
  }

  // Generic error handler
  handleError(error, operation = 'API operation') {
    console.error(`Error in ${operation}:`, error);
    throw new Error(error.message || `Failed to ${operation}`);
  }

  // Generic success response
  formatResponse(data, message = 'Success') {
    return {
      success: true,
      data,
      message
    };
  }
}

// Products API
export class ProductsAPI extends ApiService {
  async getAllProducts() {
    try {
      // Kiểm tra quyền xem sản phẩm
      await this.checkPermission(PERMISSIONS.PRODUCT_VIEW);
      
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.formatResponse(data, 'Products fetched successfully');
    } catch (error) {
      this.handleError(error, 'fetch products');
    }
  }

  async getProductById(id) {
    try {
      if (!id) throw new Error('Product ID is required');

      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.formatResponse(data, 'Product fetched successfully');
    } catch (error) {
      this.handleError(error, 'fetch product');
    }
  }

  async searchProducts(query) {
    try {
      if (!query || query.trim().length < 2) {
        return this.formatResponse([], 'Query too short');
      }

      const { data, error } = await this.client
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return this.formatResponse(data, 'Search completed');
    } catch (error) {
      this.handleError(error, 'search products');
    }
  }

  async getProductsByCategory(category) {
    try {
      if (!category) throw new Error('Category is required');

      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.formatResponse(data, 'Products by category fetched');
    } catch (error) {
      this.handleError(error, 'fetch products by category');
    }
  }
}

// Orders API
export class OrdersAPI extends ApiService {
  async createOrder(orderData) {
    try {
      // Kiểm tra quyền tạo đơn hàng
      await this.checkPermission(PERMISSIONS.ORDER_CREATE);
      
      // Validate order data
      if (!orderData.user_id) throw new Error('User ID is required');
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order items are required');
      }
      if (!orderData.total_amount || orderData.total_amount <= 0) {
        throw new Error('Valid total amount is required');
      }

      const { data, error } = await this.client
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return this.formatResponse(data, 'Order created successfully');
    } catch (error) {
      this.handleError(error, 'create order');
    }
  }

  async getUserOrders(userId) {
    try {
      // Kiểm tra quyền xem đơn hàng
      const { user } = await this.checkPermission(PERMISSIONS.ORDER_VIEW);
      
      if (!userId) throw new Error('User ID is required');
      
      // User chỉ có thể xem đơn hàng của mình, admin có thể xem tất cả
      const { userRole } = await this.checkPermission(PERMISSIONS.ORDER_VIEW);
      if (userRole !== 'admin' && user.id !== userId) {
        throw new Error('Forbidden: Can only view own orders');
      }

      const { data, error } = await this.client
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.formatResponse(data, 'User orders fetched');
    } catch (error) {
      this.handleError(error, 'fetch user orders');
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      // Chỉ admin mới có thể cập nhật trạng thái đơn hàng
      await this.checkPermission(PERMISSIONS.ORDER_MANAGE);
      
      if (!orderId) throw new Error('Order ID is required');
      if (!status) throw new Error('Status is required');

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const { data, error } = await this.client
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return this.formatResponse(data, 'Order status updated');
    } catch (error) {
      this.handleError(error, 'update order status');
    }
  }
}

// Users API
export class UsersAPI extends ApiService {
  async getUserProfile(userId) {
    try {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return this.formatResponse(data, 'User profile fetched');
    } catch (error) {
      this.handleError(error, 'fetch user profile');
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      if (!userId) throw new Error('User ID is required');
      if (!profileData) throw new Error('Profile data is required');

      // Validate email format if provided
      if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await this.client
        .from('profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return this.formatResponse(data, 'Profile updated successfully');
    } catch (error) {
      this.handleError(error, 'update user profile');
    }
  }
}

// Create instances
export const productsAPI = new ProductsAPI();
export const ordersAPI = new OrdersAPI();
export const usersAPI = new UsersAPI();
