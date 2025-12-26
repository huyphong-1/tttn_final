import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { expandCategoryValues } from "../utils/categoryUtils";

const serializeOptions = (options) => JSON.stringify(options ?? {});
const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

export const useProducts = (options = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const deps = useMemo(() => serializeOptions(options), [options]);

  const buildQuery = (applyActiveFilter = true) => {
    let query = supabase.from("products").select("*", { count: "exact" });
    const conditionFilter =
      options.condition === undefined ? "new" : options.condition;

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

    if (applyActiveFilter && options.isActive !== undefined) {
      const wantActive = Boolean(options.isActive);
      query = wantActive ? query.is("deleted_at", null) : query.not("deleted_at", "is", null);
    }

    if (options.keyword) {
      query = query.or(`name.ilike.%${options.keyword}%,brand.ilike.%${options.keyword}%`);
    }

    if (options.brand && options.brand !== "all") query = query.eq("brand", options.brand);
    if (options.brands?.length) query = query.in("brand", options.brands);

    if (hasNumber(options.priceGte)) query = query.gte("price", Number(options.priceGte));
    if (hasNumber(options.priceLte)) query = query.lte("price", Number(options.priceLte));

    if (options.featured) query = query.eq("featured", true);
    if (options.isSale) query = query.eq("is_sale", true);
    if (options.isTrending) query = query.eq("is_trending", true);
    if (options.isBestSeller) query = query.eq("is_best_seller", true);
    if (conditionFilter) query = query.eq("condition", conditionFilter);

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

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.info("[useProducts] fetch start", options);

        let { data, error, count } = await buildQuery(true);

        if (error && options.isActive !== undefined && error.code === "42703") {
          const retryRes = await buildQuery(false);
          data = retryRes.data;
          error = retryRes.error;
          count = retryRes.count;
        }

        if (error) throw error;

        if (active) {
          setProducts(data || []);
          setTotalCount(typeof count === "number" ? count : data?.length || 0);
          console.info("[useProducts] fetch success", {
            count: typeof count === "number" ? count : data?.length || 0,
            items: data?.length || 0,
          });
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
