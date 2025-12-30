import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../context/ToastContext";
import { supabase } from "../lib/supabase";

export const useProductManagement = () => {
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      // select fields: nếu bảng products nhiều cột, có thể đổi thành select('id,name,price,...', { count:'exact' })
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      // category filter
      if (filterCategory && filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      // search filter (name OR brand)
      const kw = (searchTerm || "").trim();
      if (kw) {
        // Supabase OR syntax: or('name.ilike.%abc%,brand.ilike.%abc%')
        query = query.or(`name.ilike.%${kw}%,brand.ilike.%${kw}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setProducts(Array.isArray(data) ? data : []);
      setTotalCount(typeof count === "number" ? count : 0);
    } catch (err) {
      console.error("[useProductManagement] Fetch error:", err);
      showError(err?.message || "Không thể tải danh sách sản phẩm");
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterCategory, showError]);

  const createProduct = useCallback(
    async (productData) => {
      try {
        setSaving(true);

        // normalize basic fields
        const payload = {
          ...productData,
          price: productData.price !== undefined ? Number(productData.price) : null,
          stock: productData.stock !== undefined ? Number(productData.stock) : null,
          discount: productData.discount ? Number(productData.discount) : 0,
          featured: Boolean(productData.featured),
          status: productData.status || "active",
        };

        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;

        showSuccess("Tạo sản phẩm thành công!");
        await fetchProducts();
        return data;
      } catch (err) {
        console.error("[useProductManagement] Create error:", err);
        showError(err?.message || "Không thể tạo sản phẩm");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchProducts, showSuccess, showError]
  );

  const updateProduct = useCallback(
    async (productId, productData) => {
      try {
        setSaving(true);

        const payload = {
          ...productData,
          price: productData.price !== undefined ? Number(productData.price) : undefined,
          stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
          discount: productData.discount !== undefined ? Number(productData.discount) : undefined,
          featured: productData.featured !== undefined ? Boolean(productData.featured) : undefined,
          status: productData.status || "active",
        };

        // remove undefined
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId)
          .select()
          .single();

        if (error) throw error;

        showSuccess("Cập nhật sản phẩm thành công!");
        await fetchProducts();
        return data;
      } catch (err) {
        console.error("[useProductManagement] Update error:", err);
        showError(err?.message || "Không thể cập nhật sản phẩm");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchProducts, showSuccess, showError]
  );

  const deleteProduct = useCallback(
    async (productId) => {
      try {
        setSaving(true);

        // Hard delete
        const { error } = await supabase.from("products").delete().eq("id", productId);
        if (error) throw error;

        showSuccess("Xóa sản phẩm thành công!");
        await fetchProducts();
      } catch (err) {
        console.error("[useProductManagement] Delete error:", err);
        showError(err?.message || "Không thể xóa sản phẩm");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchProducts, showSuccess, showError]
  );

  // handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleCategoryFilter = useCallback((category) => {
    setFilterCategory(category);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = useMemo(() => {
    const denom = Number(pageSize) || 1;
    const num = Number(totalCount) || 0;
    return Math.max(1, Math.ceil(num / denom));
  }, [totalCount, pageSize]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    products,
    totalCount,
    loading,
    saving,

    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,

    searchTerm,
    filterCategory,

    createProduct,
    updateProduct,
    deleteProduct,

    fetchProducts,
    refresh: fetchProducts,

    handleSearch,
    handleCategoryFilter,
    handlePageSizeChange,
    handlePageChange,
  };
};
