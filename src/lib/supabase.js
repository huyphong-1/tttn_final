import { createClient } from '@supabase/supabase-js';

// Lấy URL và Anon Key từ biến môi trường
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra sự tồn tại của các biến môi trường
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars:", { supabaseUrl, supabaseAnonKey });
}

// Tạo Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hàm lấy tất cả các đơn hàng từ bảng 'orders'
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')  // Chọn bảng 'orders'
    .select('id, total_amount, shipping_fee, payment_status, status, created_at')  // Chọn các trường cần thiết
    .order('created_at', { ascending: false });  // Sắp xếp theo thời gian tạo, đơn hàng mới nhất lên đầu

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data;
};

// Hàm lấy chi tiết trạng thái đơn hàng từ bảng 'order_status'
export const getOrderStatus = async (orderId) => {
  const { data, error } = await supabase
    .from('order_status')
    .select('status, updated_at')
    .eq('order_id', orderId)  // Lọc theo order_id
    .order('updated_at', { ascending: false });  // Sắp xếp theo thời gian cập nhật

  if (error) {
    console.error('Error fetching order status:', error);
    return [];
  }
  return data;
};

// Hàm lấy thông tin theo dõi đơn hàng từ bảng 'order_tracking'
export const getOrderTracking = async (orderId) => {
  const { data, error } = await supabase
    .from('order_tracking')
    .select('tracking_number, tracking_url, current_status, updated_at')
    .eq('order_id', orderId);  // Lọc theo order_id

  if (error) {
    console.error('Error fetching order tracking:', error);
    return [];
  }
  return data;
};

// Export Supabase client để có thể sử dụng ở nơi khác trong ứng dụng
export { supabase };
