import { useEffect, useMemo, useState, useCallback } from "react";
import { productsApi, apiUtils } from "../lib/apiClient";
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

export const usePrismaProducts = (options = {}) => {
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

  const buildApiParams = useCallback(() => {
    const params = {};
    
    // Pagination
    if (options.pageSize || options.limit) {
      params.pageSize = options.pageSize || options.limit;
    }
    if (options.page) {
      params.page = options.page;
    }
    
    // Sorting
    if (options.orderBy) {
      params.orderBy = options.orderBy;
      params.ascending = options.ascending?.toString() || 'false';
    }
    
    // Fields selection
    if (options.fields) {
      params.fields = options.fields;
    }
    
    // Count option
    if (options.count !== undefined) {
      params.count = options.count;
    }
    
    // Category filters
    if (options.category) {
      params.category = options.category;
    }
    if (options.categories?.length) {
      params.categories = Array.isArray(options.categories) 
        ? options.categories.join(',')
        : options.categories;
    }
    if (options.inCategory?.length) {
      params.inCategory = Array.isArray(options.inCategory)
        ? options.inCategory.join(',')
        : options.inCategory;
    }
    
    // Other filters
    if (options.condition) params.condition = options.condition;
    if (options.brand && options.brand !== 'all') params.brand = options.brand;
    if (options.brands?.length) {
      params.brands = Array.isArray(options.brands)
        ? options.brands.join(',')
        : options.brands;
    }
    if (options.keyword?.trim()) params.keyword = options.keyword.trim();
    if (options.priceGte) params.priceGte = options.priceGte;
    if (options.priceLte) params.priceLte = options.priceLte;
    if (options.ratingGte) params.ratingGte = options.ratingGte;
    
    // Feature flags
    if (options.featured) params.featured = 'true';
    if (options.isSale) params.isSale = 'true';
    if (options.isTrending) params.isTrending = 'true';
    if (options.isBestSeller) params.isBestSeller = 'true';
    if (options.onSaleOnly) params.onSaleOnly = 'true';
    
    // Status
    if (options.isActive !== undefined) params.isActive = options.isActive.toString();
    
    return params;
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

      // Build API parameters
      const apiParams = buildApiParams();

      // Execute API call with deduplication and timeout
      const queryStart = performance.now();
      const response = await deduplicateRequest(cacheKey, async () => {
        return productsApi.getProducts(apiParams);
      });

      const result = {
        products: response.data || [],
        count: response.count || 0,
        pagination: response.pagination
      };

      // Cache result
      const ttl = options.cacheTtlMs || CACHE_TTL_DEFAULT;
      setCache(cacheKey, result, ttl);

      setProducts(result.products);
      setTotalCount(result.count);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[usePrismaProducts] API call took ${Math.round(performance.now() - queryStart)}ms, returned ${result.products.length} items`);
      }

    } catch (err) {
      const errorMessage = apiUtils.handleError(err, 'Failed to fetch products');
      console.error('[usePrismaProducts] Error:', errorMessage);
      setError(errorMessage);
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, buildApiParams, options.cacheTtlMs]);

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
