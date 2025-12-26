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

if (supabaseUrl && supabaseAnonKey) {
  const maskedKey = supabaseAnonKey
    ? `${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-4)}`
    : null;
  console.info("[supabase] init", { url: supabaseUrl, anonKey: maskedKey });
}

const REQUEST_TIMEOUT_MS = 10000;

const createTimeoutFetch = (timeoutMs) => async (input, init = {}) => {
  const controller = new AbortController();
  const upstreamSignal = init.signal;

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  const requestLabel =
    typeof input === "string" ? input : input?.url || "unknown";
  const start = Date.now();
  console.info("[supabase] request", requestLabel);

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const duration = Date.now() - start;
    console.info("[supabase] response", response.status, `${duration}ms`, requestLabel);
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.warn("[supabase] error", `${duration}ms`, requestLabel, error);
    if (controller.signal.aborted && !upstreamSignal?.aborted) {
      throw new Error("Request timeout after 10s");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const timeoutFetch = createTimeoutFetch(REQUEST_TIMEOUT_MS);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: timeoutFetch,
  },
});

console.info("[supabase] client", {
  restFetchType: typeof supabase?.rest?.fetch,
  usesCustomFetch: supabase?.rest?.fetch === timeoutFetch,
});

const SESSION_TIMEOUT_MS = 8000;
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
let skipAuthSession = false;

supabase.auth.getSession = async (...args) => {
  if (skipAuthSession) {
    console.warn("[supabase] getSession skipped");
    return { data: { session: null }, error: null };
  }

  console.info("[supabase] getSession start");
  const timeoutResult = new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: { session: null },
        error: new Error("getSession timeout"),
      });
    }, SESSION_TIMEOUT_MS);
  });

  const result = await Promise.race([originalGetSession(...args), timeoutResult]);

  if (result?.error) {
    console.warn("[supabase] getSession end", result.error);
    skipAuthSession = true;
  } else {
    console.info("[supabase] getSession end");
  }

  return result;
};

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