// src/pages/HomePage.jsx
import React, { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { usePrismaProducts } from "../hooks/usePrismaProducts";
import ProductCard from "../components/ProductCard";
import CloudinaryImage from "../components/CloudinaryImage";
import { PRODUCT_LIST_FIELDS } from "../constants/productFields";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const CACHE_TTL_MS = 300000;

const HomePage = () => {
  const { addItem } = useCart();
  const { products, loading, error } = usePrismaProducts({
    inCategory: ["phone", "phones"],
    orderBy: "created_at",
    pageSize: 6,
    fields: PRODUCT_LIST_FIELDS,
    count: null,
    cacheTtlMs: CACHE_TTL_MS,
  });

  const heroProduct = products[0];
  const showEmpty = !loading && !error && products.length === 0;

  const handleAddToCart = useCallback((product) => {
    addItem({
      id: `home-${product.id}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
    });
  }, [addItem]);

  return (
    <div className="bg-slate-950 text-slate-50 flex-1">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-[0.2em] mb-3">
              Di Động Việt
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Lên đời <span className="text-blue-400">smartphone flagship</span> giá ưu đãi.
            </h1>
            <p className="text-sm md:text-base text-slate-300 mb-6">
              Hàng chính hãng, bảo hành 100%. Freeship tại Hà Nội và TP.HCM.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="#products"
                className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-medium transition"
              >
                Xem điện thoại hot
              </a>
              <Link
                to="/phones"
                className="px-4 py-2 rounded-full border border-slate-700 hover:border-slate-500 text-sm transition"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-300">
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">Freeship</p>
                <p>Freeship tại Hà Nội và TP.HCM</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">Trả góp 0% </p>
                <p>Qua thẻ tín dụng</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">Đổi trả trong vòng 30 ngày</p>
                <p>Trong trường hợp lỗi từ phía nhà sản xuất</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -left-6 bottom-0 w-28 h-28 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative border border-slate-800 rounded-3xl bg-slate-900/60 p-4 md:p-6 shadow-xl shadow-slate-900/80">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-4">
                <CloudinaryImage
                  publicId={heroProduct?.image}
                  alt={heroProduct?.name || "Flagship"}
                  preset="PRODUCT_DETAIL"
                  className="w-full h-full"
                  fallbackSrc="/products/iphone-15-pro-max-256gb.png"
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-blue-400 mb-1">Deal hot</p>
                  <p className="font-semibold text-sm">{heroProduct?.name || "San pham moi"}</p>
                  <p className="text-xs text-slate-300 mt-1">Giá ưu đãi</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">
                    {formatPrice(heroProduct?.price || 0)}
                  </p>
                  <p className="text-[10px] text-emerald-400 mt-1">Trả góp 0%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">Sản phẩm hot</h2>
          <p className="text-sm text-slate-300 mb-6">
            Flagship mới nhất.
          </p>

          {loading && <p className="text-sm text-slate-400 mb-4">Đang tải sản phẩm mới</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {showEmpty ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Chưa có sản phẩm nào trong cơ sở dữ liệu. Hãy thêm sản phẩm tại trang quản trị để hiển thị ở đây.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
