import { createClient } from '@supabase/supabase-js';
import config from '../config/environment';

// L?y URL và Anon Key t? config
const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, user_id, order_number, total_amount, payment_status, status, created_at, customer_name, customer_email, shipping_city, items'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data;
};

export const getOrdersByUser = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, total_amount, payment_status, status, created_at, items, shipping_city, payment_method, customer_name'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
  return data;
};

export const createOrderRecord = async (payload) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating order record:', error);
    throw error;
  }
  return data;
};

export const getOrderStatus = async (orderId) => {
  const { data, error } = await supabase
    .from('order_status')
    .select('status, updated_at')
    .eq('order_id', orderId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching order status:', error);
    return [];
  }
  return data;
};

export const getOrderTracking = async (orderId) => {
  const { data, error } = await supabase
    .from('order_tracking')
    .select('tracking_number, tracking_url, current_status, updated_at')
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching order tracking:', error);
    return [];
  }
  return data;
};

export { supabase };