import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiFilter, FiRefreshCcw, FiSearch, FiX } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import CloudinaryImage from "../components/CloudinaryImage";
import { expandCategoryValues } from "../utils/categoryUtils";
import { PRODUCT_SEARCH_FIELDS } from "../constants/productFields";

const categories = [
  { label: "Tất cả", value: "all" },
  { label: "Điện thoại", value: "phones" },
  { label: "Phụ kiện", value: "accessories" },
  { label: "Máy tính bảng", value: "tablets" },
  { label: "Laptop", value: "laptops" },
  { label: "Smartwatch", value: "smartwatch" },
  { label: "Tai nghe", value: "headphones" },
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
  { value: "best_selling", label: "Bán chạy" },
];

const ratingOptions = [
  { label: "Tất cả", value: "" },
  { label: "Từ 4★ trở lên", value: "4" },
  { label: "Từ 3★ trở lên", value: "3" },
  { label: "Từ 2★ trở lên", value: "2" },
];

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const buildInitialFilters = (params) => ({
  keyword: params.get("q") || "",
  category: params.get("category") || "all",
  brand: params.get("brand") || "all",
  minPrice: params.get("minPrice") || "",
  maxPrice: params.get("maxPrice") || "",
  rating: params.get("rating") || "",
  color: params.get("color") || "",
  onSale: params.get("onSale") === "true",
  featured: params.get("featured") === "true",
  sort: params.get("sort") || "newest",
});

export default function SearchPage() {
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => buildInitialFilters(searchParams));
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ brands: [], colors: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncQueryParams = (nextFilters) => {
    const params = new URLSearchParams();
    if (nextFilters.keyword) params.set("q", nextFilters.keyword);
    if (nextFilters.category && nextFilters.category !== "all") {
      params.set("category", nextFilters.category);
    }
    if (nextFilters.brand && nextFilters.brand !== "all") {
      params.set("brand", nextFilters.brand);
    }
    if (nextFilters.minPrice) params.set("minPrice", nextFilters.minPrice);
    if (nextFilters.maxPrice) params.set("maxPrice", nextFilters.maxPrice);
    if (nextFilters.rating) params.set("rating", nextFilters.rating);
    if (nextFilters.color) params.set("color", nextFilters.color);
    if (nextFilters.onSale) params.set("onSale", "true");
    if (nextFilters.featured) params.set("featured", "true");
    if (nextFilters.sort && nextFilters.sort !== "newest") {
      params.set("sort", nextFilters.sort);
    }
    setSearchParams(params);
  };

  const updateFilters = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      syncQueryParams(next);
      return next;
    });
  };

  const clearFilters = () => {
    const reset = {
      keyword: "",
      category: "all",
      brand: "all",
      minPrice: "",
      maxPrice: "",
      rating: "",
      color: "",
      onSale: false,
      featured: false,
      sort: "newest",
    };
    setFilters(reset);
    setSearchParams({});
  };

  useEffect(() => {
    setFilters(buildInitialFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const fetchFacets = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("brand,color")
          .eq("condition", "new")
          .limit(500);
        if (error) throw error;

        const brandSet = new Set();
        const colorSet = new Set();
        (data || []).forEach((item) => {
          if (item.brand) brandSet.add(item.brand);
          if (item.color) colorSet.add(item.color);
        });

        setFacets({
          brands: Array.from(brandSet).sort(),
          colors: Array.from(colorSet).sort(),
        });
      } catch (facetError) {
        console.warn("Cannot fetch facets:", facetError);
        setFacets({ brands: [], colors: [] });
      }
    };

    fetchFacets();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("products")
          .select(PRODUCT_SEARCH_FIELDS)
          .eq("condition", "new");

        if (filters.keyword) {
          query = query.or(
            `name.ilike.%${filters.keyword}%,brand.ilike.%${filters.keyword}%`
          );
        }
        if (filters.category !== "all") {
          const variants = expandCategoryValues([filters.category]);
          if (variants.length) {
            query = query.in("category", variants);
          }
        }
        if (filters.brand !== "all" && filters.brand) {
          query = query.ilike("brand", `%${filters.brand}%`);
        }
        if (filters.minPrice) {
          query = query.gte("price", Number(filters.minPrice));
        }
        if (filters.maxPrice) {
          query = query.lte("price", Number(filters.maxPrice));
        }
        if (filters.rating) {
          query = query.gte("rating", Number(filters.rating));
        }
        if (filters.color) {
          query = query.ilike("color", `%${filters.color}%`);
        }
        if (filters.onSale) {
          query = query.gt("discount", 0);
        }
        if (filters.featured) {
          query = query.eq("featured", true);
        }

        switch (filters.sort) {
          case "price_asc":
            query = query.order("price", { ascending: true });
            break;
          case "price_desc":
            query = query.order("price", { ascending: false });
            break;
          case "name_asc":
            query = query.order("name", { ascending: true });
            break;
          case "name_desc":
            query = query.order("name", { ascending: false });
            break;
          case "best_selling":
            query = query.order("discount", { ascending: false }).order("created_at", { ascending: false });
            break;
          default:
            query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query.limit(60);
        if (error) throw error;
        setProducts(data || []);
      } catch (fetchError) {
        console.error("Search fetch error:", fetchError);
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const brandOptions = useMemo(() => {
    if (facets.brands.length > 0) return facets.brands;
    const set = new Set();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [facets.brands, products]);

  const colorOptions = useMemo(() => {
    if (facets.colors.length > 0) return facets.colors;
    const set = new Set();
    products.forEach((p) => {
      if (p.color) set.add(p.color);
    });
    return Array.from(set);
  }, [facets.colors, products]);

  const handleAddToCart = (product) => {
    addItem({
      id: `search-${product.id}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
    });
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.category !== "all") {
      chips.push({
        label: `Danh mục: ${filters.category}`,
        action: () => updateFilters({ category: "all" }),
      });
    }
    if (filters.brand !== "all" && filters.brand) {
      chips.push({
        label: `Thương hiệu: ${filters.brand}`,
        action: () => updateFilters({ brand: "all" }),
      });
    }
    if (filters.minPrice) {
      chips.push({
        label: `Giá ≥ ${formatPrice(filters.minPrice)}`,
        action: () => updateFilters({ minPrice: "" }),
      });
    }
    if (filters.maxPrice) {
      chips.push({
        label: `Giá ≤ ${formatPrice(filters.maxPrice)}`,
        action: () => updateFilters({ maxPrice: "" }),
      });
    }
    if (filters.rating) {
      chips.push({
        label: `Đánh giá từ ${filters.rating}★`,
        action: () => updateFilters({ rating: "" }),
      });
    }
    if (filters.color) {
      chips.push({
        label: `Màu: ${filters.color}`,
        action: () => updateFilters({ color: "" }),
      });
    }
    if (filters.onSale) {
      chips.push({
        label: "Đang giảm giá",
        action: () => updateFilters({ onSale: false }),
      });
    }
    if (filters.featured) {
      chips.push({
        label: "Nổi bật",
        action: () => updateFilters({ featured: false }),
      });
    }
    return chips;
  }, [filters]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
          <FiSearch />
          Khám phá sản phẩm
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-white">Tìm kiếm & Lọc sản phẩm</h1>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-200 hover:border-blue-500 hover:text-blue-400 transition"
          >
            <FiRefreshCcw />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FiFilter />
            Bộ lọc nâng cao
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-400">Từ khóa</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => updateFilters({ keyword: e.target.value })}
              placeholder="Tên, thương hiệu..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-400">Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-400">Thương hiệu</label>
            <select
              value={filters.brand}
              onChange={(e) => updateFilters({ brand: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">Tất cả</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Giá tối thiểu</label>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Giá tối đa</label>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                placeholder="50.000.000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-400">Màu sắc</label>
            <input
              type="text"
              list="color-options"
              value={filters.color}
              onChange={(e) => updateFilters({ color: e.target.value })}
              placeholder="Đen, Trắng..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            <datalist id="color-options">
              {colorOptions.map((color) => (
                <option value={color} key={color} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-400">Đánh giá</label>
            <select
              value={filters.rating}
              onChange={(e) => updateFilters({ rating: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
            >
              {ratingOptions.map((r) => (
                <option value={r.value} key={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filters.onSale}
              onChange={(e) => updateFilters({ onSale: e.target.checked })}
              className="accent-blue-500"
            />
            Đang giảm giá
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => updateFilters({ featured: e.target.checked })}
              className="accent-blue-500"
            />
            Sản phẩm nổi bật
          </label>
        </aside>

        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
            <div>
              <p className="text-sm text-slate-400">
                Tìm thấy{" "}
                <span className="text-white font-semibold">{products.length}</span> sản phẩm phù hợp
              </p>
              {filters.keyword && (
                <p className="text-xs text-slate-500 mt-1">
                  Từ khóa: <span className="text-white">{filters.keyword}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Sắp xếp theo</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
              >
                {sortOptions.map((s) => (
                  <option value={s.value} key={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:border-blue-500 hover:text-blue-300 transition"
                  onClick={chip.action}
                >
                  {chip.label}
                  <FiX />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              Đang tải sản phẩm...
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-sm text-red-300">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Không có sản phẩm nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-blue-500/70 transition"
                >
                  <Link to={`/product/${product.id}`} className="block aspect-[4/5] bg-slate-900 overflow-hidden">
                    <CloudinaryImage
                      publicId={product.image}
                      alt={product.name}
                      preset="PRODUCT_CARD"
                      className="w-full h-full transition duration-300 hover:scale-105"
                      enableProgressiveLoading={true}
                    />
                  </Link>
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase text-slate-400">
                      {product.brand || product.category || "Sản phẩm"}
                    </p>
                    <Link to={`/product/${product.id}`}>
                      <p className="text-sm font-semibold text-white line-clamp-2 hover:text-blue-400 transition">
                        {product.name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-blue-400">
                        {formatPrice(product.price)}
                      </p>
                      {product.old_price && (
                        <p className="text-xs text-slate-500 line-through">
                          {formatPrice(product.old_price)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {product.rating && <span>⭐ {Number(product.rating).toFixed(1)}</span>}
                      {product.color && (
                        <span className="px-2 py-0.5 bg-slate-800 rounded-full">{product.color}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
