import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import AdvancedFilterBar from "../components/filters/AdvancedFilterBar";
import Pagination from "../components/Pagination";
import { BRAND_OPTIONS, SORT_OPTIONS, getSortConfig } from "../constants/filterOptions";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const toNumberOrNull = (value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const PAGE_SIZE = 12;

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

  const { products, loading, error, totalCount } = useProducts({
    isBestSeller: true,
    keyword: debouncedKeyword || undefined,
    brand,
    priceGte: normalizedMin,
    priceLte: normalizedMax,
    orderBy: sortConfig.orderBy,
    ascending: sortConfig.ascending,
    pageSize: PAGE_SIZE,
    page,
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

  const handleAdd = (p) => {
    addItem({
      id: `best-${p.id}`,
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image,
    });
  };

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Best Selling</h1>
        <p className="text-sm text-slate-400 mt-1">San pham ban chay nhat trong tuan nay.</p>
      </div>

      <AdvancedFilterBar
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
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden relative"
          >
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/90 text-white">
                {p.badge || "Best"}
              </span>
            </div>

            <Link to={`/product/${p.id}`} className="block h-[380px] bg-slate-900">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover opacity-80 transition duration-300 hover:opacity-100"
                loading="lazy"
              />
            </Link>

            <div className="p-4 border-t border-slate-800/80">
              <Link to={`/product/${p.id}`}>
                <p className="text-sm font-semibold line-clamp-2 hover:text-blue-400 transition">
                  {p.name}
                </p>
              </Link>
              <p className="mt-1 text-sm font-bold text-blue-400">
                {formatPrice(p.price)}
              </p>

              <button
                onClick={() => handleAdd(p)}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
              >
                Them vao gio
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
