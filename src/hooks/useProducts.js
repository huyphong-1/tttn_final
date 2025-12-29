import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { expandCategoryValues } from "../utils/categoryUtils";

const serializeOptions = (options) => {
  // Tạo cache key stable hơn bằng cách sort keys
  const sorted = Object.keys(options ?? {})
    .sort()
    .reduce((result, key) => {
      result[key] = options[key];
      return result;
    }, {});
  return JSON.stringify(sorted);
};

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

// Tăng cache size và implement LRU eviction
const MAX_CACHE_SIZE = 50;
const PRODUCT_CACHE = new Map();

const evictOldestCache = () => {
  if (PRODUCT_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = PRODUCT_CACHE.keys().next().value;
    PRODUCT_CACHE.delete(firstKey);
  }
};

const getCacheEntry = (key, ttlMs) => {
  if (!ttlMs || ttlMs <= 0) return null;
  const entry = PRODUCT_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    PRODUCT_CACHE.delete(key);
    return null;
  }
  return entry;
};

const setCacheEntry = (key, payload) => {
  evictOldestCache();
  // Move to end cho LRU behavior
  if (PRODUCT_CACHE.has(key)) {
    PRODUCT_CACHE.delete(key);
  }
  PRODUCT_CACHE.set(key, { ...payload, timestamp: Date.now() });
};

export const useProducts = (options = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const deps = useMemo(() => serializeOptions(options), [options]);

  const resolveSelectFields = () => {
    const fields = typeof options.fields === "string" ? options.fields.trim() : "";
    return fields.length > 0 ? fields : "*";
  };

  const resolveCount = () => {
    if (options.count === null || options.count === false) return null;
    if (typeof options.count === "string" && options.count.length > 0) return options.count;
    return "estimated";
  };

  const buildQuery = (applyActiveFilter = true) => {
    const selectFields = resolveSelectFields();
    const countOption = resolveCount();
    const selectOptions = countOption ? { count: countOption } : undefined;
    let query = supabase.from("products").select(selectFields, selectOptions);
    const conditionFilter =
      options.condition === undefined ? "new" : options.condition;

    // Apply most selective filters first for better query performance
    if (conditionFilter) query = query.eq("condition", conditionFilter);

    if (options.category) {
      const variants = expandCategoryValues([options.category]);
      if (variants.length) query = query.in("category", variants);
    }

    if (options.categories?.length) {
      const variants = expandCategoryValues(options.categories);
      if (variants.length) query = query.in("category", variants);
    }

    if (options.inCategory?.length) {
      const variants = expandCategoryValues(options.inCategory);
      if (variants.length) query = query.in("category", variants);
    }

    // Apply status filters early (highly selective)
    if (applyActiveFilter && options.isActive !== undefined) {
      const wantActive = Boolean(options.isActive);
      query = wantActive ? query.is("deleted_at", null) : query.not("deleted_at", "is", null);
    }

    // Apply feature flags (selective)
    if (options.featured) query = query.eq("featured", true);
    if (options.isSale) query = query.eq("is_sale", true);
    if (options.isTrending) query = query.eq("is_trending", true);
    if (options.isBestSeller) query = query.eq("is_best_seller", true);

    // Apply brand filters (moderately selective)  
    if (options.brand && options.brand !== "all") query = query.eq("brand", options.brand);
    if (options.brands?.length) query = query.in("brand", options.brands);

    // Apply price range (numeric range - use indexes)
    if (hasNumber(options.priceGte)) query = query.gte("price", Number(options.priceGte));
    if (hasNumber(options.priceLte)) query = query.lte("price", Number(options.priceLte));

    // Apply text search last (least selective, most expensive)
    if (options.keyword) {
      query = query.or(`name.ilike.%${options.keyword}%,brand.ilike.%${options.keyword}%`);
    }

    if (options.ratingGte) query = query.gte("rating", Number(options.ratingGte));
    if (options.onSaleOnly) query = query.gt("discount", 0);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }

    const pageSize = Number(options.pageSize ?? options.limit ?? 0);
    const pageNumber = Math.max(1, Number(options.page ?? 1));

    if (pageSize > 0) {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    return query;
  };

  useEffect(() => {
    let active = true;
    const cacheTtlMs = Number(options.cacheTtlMs ?? 0);
    const cacheKey = deps;

    const fetchProducts = async () => {
      try {
        const cached = getCacheEntry(cacheKey, cacheTtlMs);
        if (cached && active) {
          setProducts(cached.data || []);
          setTotalCount(
            typeof cached.count === "number" ? cached.count : cached.data?.length || 0
          );
          setError(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        // Add query timeout and performance tracking
        const queryStart = performance.now();
        let { data, error, count } = await Promise.race([
          buildQuery(true),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 10000)
          )
        ]);
        
        if (process.env.NODE_ENV === 'development') {
          console.info("[useProducts] query took:", Math.round(performance.now() - queryStart), 'ms');
        }

        if (error && options.isActive !== undefined && error.code === "42703") {
          const retryRes = await buildQuery(false);
          data = retryRes.data;
          error = retryRes.error;
          count = retryRes.count;
        }

        if (error) throw error;

        if (active) {
          const nextData = data || [];
          const nextCount = typeof count === "number" ? count : nextData.length || 0;
          setProducts(nextData);
          setTotalCount(nextCount);
          if (process.env.NODE_ENV === 'development') {
            console.info("[useProducts] fetch success", {
              count: typeof count === "number" ? count : nextData.length || 0,
              items: nextData.length || 0,
            });
          }
          if (cacheTtlMs > 0) {
            setCacheEntry(cacheKey, { data: nextData, count: nextCount });
          }
        }
      } catch (err) {
        if (active) {
          console.error("useProducts error:", err);
          setError(err.message || "Khong the tai san pham");
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, [deps]);

  return { products, loading, error, totalCount };
};
