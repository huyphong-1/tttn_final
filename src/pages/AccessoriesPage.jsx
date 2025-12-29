import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { usePrismaProducts } from "../hooks/usePrismaProducts";
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

export default function AccessoriesPage() {
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

  const { products, loading, error, totalCount } = usePrismaProducts({
    inCategory: ["accessory", "accessories"],
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

  const handleAddToCart = useCallback((acc) => {
    addItem({
      id: `acc-${acc.id}`,
      productId: acc.id,
      name: acc.name,
      price: Number(acc.price),
      image: acc.image,
    });
  }, [addItem]);

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Tat ca phu kien</h1>

      <OptimizedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: AirPods, sac nhanh..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 200000 - 5000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && <p className="text-sm text-slate-400 mt-2">Dang tai phu kien...</p>}
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {showEmpty && (
        <p className="text-sm text-slate-400 mt-2">
          {isFiltering ? "Khong tim thay phu kien trong bo loc nay." : "Chua co phu kien trong DB."}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((acc) => (
          <ProductCard
            key={acc.id}
            product={{ ...acc, badge: "Accessory" }}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
