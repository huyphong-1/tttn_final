import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE_DEFAULT = 12;

export function useSupabaseProducts(options = {}) {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stableKey = useMemo(() => JSON.stringify(options || {}), [options]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const pageSize = options.pageSize ?? options.limit ?? PAGE_SIZE_DEFAULT;
      const page = options.page ?? 1;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const fields = options.fields
        ? Array.isArray(options.fields)
          ? options.fields.join(",")
          : options.fields
        : "*";

      let q = supabase.from("products").select(fields, { count: "exact" });

      if (options.inCategory?.length) {
        const cats = Array.isArray(options.inCategory)
          ? options.inCategory
          : String(options.inCategory).split(",");
        q = q.in("category", cats);
      } else if (options.category) {
        q = q.eq("category", options.category);
      }

      if (options.brand && options.brand !== "all") q = q.eq("brand", options.brand);

      if (typeof options.keyword === "string" && options.keyword.trim()) {
        q = q.ilike("name", `%${options.keyword.trim()}%`);
      }

      if (options.priceGte !== null && options.priceGte !== undefined)
        q = q.gte("price", options.priceGte);
      if (options.priceLte !== null && options.priceLte !== undefined)
        q = q.lte("price", options.priceLte);
      if (options.ratingGte !== null && options.ratingGte !== undefined)
        q = q.gte("rating", options.ratingGte);

      if (options.isActive !== undefined) q = q.eq("is_active", options.isActive);

      if (options.orderBy) {
        q = q.order(options.orderBy, { ascending: !!options.ascending });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      q = q.range(from, to);

      const { data, count, error: qErr } = await q;
      if (qErr) throw qErr;

      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (e) {
      setProducts([]);
      setTotalCount(0);
      setError(e?.message || "Failed to fetch products");
      console.error("[useSupabaseProducts] error:", e);
    } finally {
      setLoading(false);
    }
  }, [stableKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, totalCount, loading, error, refresh: fetchProducts };
}
