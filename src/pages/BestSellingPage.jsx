import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useSupabaseProducts } from "../hooks/useSupabaseProducts";
import ProductCard from "../components/ProductCard";
import OptimizedFilterBar from "../components/OptimizedFilterBar";
import Pagination from "../components/Pagination";
import { BRAND_OPTIONS, SORT_OPTIONS, getSortConfig } from "../constants/filterOptions";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PRODUCT_LIST_FIELDS } from "../constants/productFields";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const toNumberOrNull = (value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PAGE_SIZE = 12;
const CACHE_TTL_MS = 300000;

export default function BestSellingPage() {
  const { addItem } = useCart();

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);

  const normalizedMin = useMemo(() => toNumberOrNull(minPrice), [minPrice]);
  const normalizedMax = useMemo(() => toNumberOrNull(maxPrice), [maxPrice]);
  const debouncedKeyword = useDebouncedValue(q.trim(), 300);
  const sortConfig = useMemo(() => getSortConfig(SORT_OPTIONS, sort), [sort]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, brand, normalizedMin, normalizedMax, sort]);

  const { products, loading, error, totalCount } = useSupabaseProducts({
    isBestSeller: true,
    keyword: debouncedKeyword || undefined,
    brand,
    priceGte: normalizedMin,
    priceLte: normalizedMax,
    orderBy: sortConfig.orderBy,
    ascending: sortConfig.ascending,
    pageSize: PAGE_SIZE,
    page,
    fields: PRODUCT_LIST_FIELDS,
    cacheTtlMs: CACHE_TTL_MS,
  });

  const isFiltering =
    !!debouncedKeyword || brand !== "all" || minPrice !== "" || maxPrice !== "";

  const resetFilters = () => {
    setQ("");
    setBrand("all");
    setMinPrice("");
    setMaxPrice("");
    setSort(SORT_OPTIONS[0].value);
  };

  const handleAdd = useCallback((p) => {
    addItem({
      id: `best-${p.id}`,
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image,
    });
  }, [addItem]);

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Best Selling</h1>
        <p className="text-sm text-slate-400 mt-1">San pham ban chay nhat trong tuan nay.</p>
      </div>

      <OptimizedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: iPhone, Galaxy, laptop..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 7000000 - 30000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && <p className="text-sm text-slate-400 mb-4">Dang tai san pham...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {showEmpty && (
        <p className="text-sm text-slate-400 mb-4">
          {isFiltering ? "Khong co san pham trong bo loc nay." : "Chua co san pham best-selling trong co so du lieu."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={{ ...p, badge: p.badge || "Best" }}
            onAddToCart={handleAdd}
          />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
