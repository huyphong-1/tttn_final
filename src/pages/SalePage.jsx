import React from "react";
import { useCart } from "../context/CartContext";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const saleProducts = [
  {
    id: 201,
    name: "iPhone 15 Pro Max 256GB (Sale)",
    price: 29990000,
    oldPrice: 31990000,
    image:
      "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "-10%",
  },
  {
    id: 202,
    name: "Samsung Galaxy S24 Ultra (Sale)",
    price: 26990000,
    oldPrice: 28990000,
    image:
      "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "-7%",
  },
  {
    id: 203,
    name: "Xiaomi 14 256GB (Sale)",
    price: 17990000,
    oldPrice: 18990000,
    image:
      "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1200",
    badge: "-5%",
  },
];

const formatPrice = (n) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function SalePage() {
  const { addItem } = useCart();

  const handleAdd = (p) => {
    addItem({
      id: `sale-${p.id}`,
      name: p.name,
      price: p.price,
      image: p.image,
    });
  };

  useEffect(() => {
    const fetchPhones = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_sale", true)
        .order("created_at", { ascending: false });

      if (!error) setPhones(data);
    };
    fetchPhones();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Khuyến mãi</h1>
        <p className="text-sm text-slate-400 mt-1">
          Deal ngon mỗi ngày — số lượng có hạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {saleProducts.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden relative"
          >
            {/* Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/90 text-white">
                {p.badge}
              </span>
            </div>

            {/* Image */}
            <div className="h-[380px] bg-slate-900">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover opacity-80"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="p-4 border-t border-slate-800/80">
              <p className="text-sm font-semibold line-clamp-2">{p.name}</p>

              <div className="mt-1 flex items-end gap-2">
                <p className="text-sm font-bold text-blue-400">
                  {formatPrice(p.price)}
                </p>
                <p className="text-xs text-slate-500 line-through">
                  {formatPrice(p.oldPrice)}
                </p>
              </div>

              <button
                onClick={() => handleAdd(p)}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold transition"
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
