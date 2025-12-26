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
export default function UsedPage() {
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
    condition: "used",
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
    setPage(1);
  };

  const handleAdd = (product) => {
    addItem({
      id: `used-${product.id}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
    });
  };

  const showEmpty = !loading && !error && products.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Máy cũ giá tốt</h1>
        <p className="text-sm text-slate-400 mt-1">
          Danh sách máy đã qua sử dụng.
        </p>
      </div>

      <AdvancedFilterBar
        query={q}
        onQueryChange={setQ}
        searchPlaceholder="VD: iPhone cu, Galaxy secondhand..."
        brand={brand}
        onBrandChange={setBrand}
        brandOptions={BRAND_OPTIONS}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        priceHint="VD: 3000000 - 15000000"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        onReset={resetFilters}
      />

      {loading && (
        <p className="text-sm text-slate-400 mt-4">Dang tai danh sach may cu...</p>
      )}
      {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
      {showEmpty && (
        <p className="text-sm text-slate-400 mt-4">
          {isFiltering
            ? "Không tìm thấy sản phẩm phù hợp."
            : "Hết hàng."}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/70 transition"
          >
            <Link to={`/product/${product.id}`} className="block aspect-[4/3] bg-slate-900">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition duration-300 hover:scale-105"
              />
            </Link>

            <div className="p-4 space-y-2">
              <p className="text-xs uppercase text-slate-400">
                {product.brand || product.category || "Used"}
              </p>
              <Link to={`/product/${product.id}`}>
                <p className="text-sm font-semibold line-clamp-2 hover:text-blue-400 transition">
                  {product.name}
                </p>
              </Link>
              <p className="text-sm font-bold text-blue-400">{formatPrice(product.price)}</p>

              <button
                onClick={() => handleAdd(product)}
                className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-medium"
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </main>
  );
}
