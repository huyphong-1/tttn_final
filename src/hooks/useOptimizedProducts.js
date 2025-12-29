import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { expandCategoryValues } from "../utils/categoryUtils";
import { deduplicateRequest } from "../utils/requestDeduplication";

// Optimized cache with better memory management
const CACHE_SIZE = 100;
const CACHE_TTL_DEFAULT = 300000; // 5 minutes
const productCache = new Map();

const evictCache = () => {
  if (productCache.size >= CACHE_SIZE) {
    const oldestKey = productCache.keys().next().value;
    productCache.delete(oldestKey);
  }
};

const getCached = (key) => {
  const entry = productCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    productCache.delete(key);
    return null;
  }
  
  // Move to end for LRU
  productCache.delete(key);
  productCache.set(key, entry);
  return entry.data;
};

const setCache = (key, data, ttl = CACHE_TTL_DEFAULT) => {
  evictCache();
  productCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export const useOptimizedProducts = (options = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const cacheKey = useMemo(() => {
    // Create stable cache key
    const sorted = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        acc[key] = options[key];
        return acc;
      }, {});
    return JSON.stringify(sorted);
  }, [options]);

  const buildOptimizedQuery = useCallback(() => {
    const fields = options.fields || "id,name,price,image,brand,category,condition,rating,is_sale,is_trending,is_best_seller,featured";
    let query = supabase.from("products").select(fields, { count: options.count });
    
    // Apply filters in order of selectivity (most selective first)
    
    // 1. Condition filter (very selective)
    const condition = options.condition ?? "new";
    if (condition) {
      query = query.eq("condition", condition);
    }
    
    // 2. Status filters (selective)
    if (options.isActive !== false) {
      query = query.is("deleted_at", null);
    }
    
    // 3. Feature flags (moderately selective)
    if (options.featured) query = query.eq("featured", true);
    if (options.isSale) query = query.eq("is_sale", true);
    if (options.isTrending) query = query.eq("is_trending", true);
    if (options.isBestSeller) query = query.eq("is_best_seller", true);
    
    // 4. Category filters (moderately selective)
    if (options.category) {
      const variants = expandCategoryValues([options.category]);
      if (variants.length) query = query.in("category", variants);
    }
    if (options.inCategory?.length) {
      const variants = expandCategoryValues(options.inCategory);
      if (variants.length) query = query.in("category", variants);
    }
    
    // 5. Brand filters (moderately selective)
    if (options.brand && options.brand !== "all") {
      query = query.eq("brand", options.brand);
    }
    if (options.brands?.length) {
      query = query.in("brand", options.brands);
    }
    
    // 6. Numeric range filters (use indexes)
    if (options.priceGte) query = query.gte("price", Number(options.priceGte));
    if (options.priceLte) query = query.lte("price", Number(options.priceLte));
    if (options.ratingGte) query = query.gte("rating", Number(options.ratingGte));
    if (options.onSaleOnly) query = query.gt("discount", 0);
    
    // 7. Text search (least selective, most expensive - apply last)
    if (options.keyword?.trim()) {
      const keyword = options.keyword.trim();
      query = query.or(`name.ilike.%${keyword}%,brand.ilike.%${keyword}%`);
    }
    
    // 8. Ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    } else {
      // Default ordering for better performance
      query = query.order("created_at", { ascending: false });
    }
    
    // 9. Pagination
    const pageSize = Number(options.pageSize || options.limit || 12);
    const pageNumber = Math.max(1, Number(options.page || 1));
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    return query;
  }, [options]);

  const fetchProducts = useCallback(async () => {
    try {
      // Check cache first
      const cached = getCached(cacheKey);
      if (cached) {
        setProducts(cached.products || []);
        setTotalCount(cached.count || 0);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Execute query with deduplication and timeout
      const queryStart = performance.now();
      const { data, error, count } = await deduplicateRequest(cacheKey, async () => {
        return Promise.race([
          buildOptimizedQuery(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 8s')), 8000)
          )
        ]);
      });

      if (error) throw error;

      const result = {
        products: data || [],
        count: typeof count === 'number' ? count : (data?.length || 0)
      };

      // Cache result
      const ttl = options.cacheTtlMs || CACHE_TTL_DEFAULT;
      setCache(cacheKey, result, ttl);

      setProducts(result.products);
      setTotalCount(result.count);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[useOptimizedProducts] Query took ${Math.round(performance.now() - queryStart)}ms, returned ${result.products.length} items`);
      }

    } catch (err) {
      console.error('[useOptimizedProducts] Error:', err);
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, buildOptimizedQuery, options.cacheTtlMs]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    totalCount,
    refresh: fetchProducts
  };
};
