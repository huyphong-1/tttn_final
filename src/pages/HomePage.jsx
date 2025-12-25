// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max 256GB",
    price: 31990000,
    image: "/phones/iphone15pm.jpg",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 28990000,
    image: "/phones/s24ultra.jpg",
  },
  {
    id: 3,
    name: "Xiaomi 14 256GB",
    price: 18990000,
    image: "/phones/xiaomi14.jpg",
  },
];

const formatPrice = (n) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const HomePage = () => {
  const { addItem } = useCart();

  return (
    <div className="bg-slate-950 text-slate-50 flex-1">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-[0.2em] mb-3">
              TechPhone Official Store
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Lên đời <span className="text-blue-400">smartphone flagship</span>{" "}
              với giá sinh viên.
            </h1>
            <p className="text-sm md:text-base text-slate-300 mb-6">
              Hàng chính hãng, bảo hành toàn quốc, hỗ trợ trả góp 0%. Freeship
              đơn từ 1.000.000₫ tại Hà Nội &amp; TP.HCM.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="#products"
                className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-medium transition"
              >
                Xem điện thoại hot 🔥
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
                <p>Đơn từ 1.000.000₫</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">Trả góp 0%</p>
                <p>Qua thẻ tín dụng</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-100">Đổi trả 30 ngày</p>
                <p>Nếu lỗi nhà sản xuất</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -left-6 bottom-0 w-28 h-28 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative border border-slate-800 rounded-3xl bg-slate-900/60 p-4 md:p-6 shadow-xl shadow-slate-900/80">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-4">
                <img
                  src="/phones/iphone15pm.jpg"
                  alt="Flagship Phone"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-blue-400 mb-1">Deal nổi bật</p>
                  <p className="font-semibold text-sm">
                    iPhone 15 Pro Max 256GB
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Giảm ngay 3.000.000₫ + tặng sạc nhanh
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs line-through text-slate-500">
                    34.990.000₫
                  </p>
                  <p className="text-lg font-bold text-blue-400">
                    31.990.000₫
                  </p>
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Trả góp chỉ từ 2.6tr/tháng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            Điện thoại nổi bật
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            Flagship mới nhất, giá tốt, hỗ trợ thu cũ đổi mới.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="group border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/10 transition"
              >
                <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm line-clamp-2">
                    {p.name}
                  </p>
                  <p className="text-sm text-blue-400">{formatPrice(p.price)}</p>
                  <button
                    onClick={() => addItem(p)}
                    className="mt-2 text-[11px] px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 font-medium transition"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
