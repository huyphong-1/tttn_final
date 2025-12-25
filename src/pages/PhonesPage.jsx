import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom"; 

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function PhonesPage() {
  const { addItem } = useCart();
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAdd = (p) => {
    addItem({
      id: `phone-${p.id}`,
      name: p.name,
      price: p.price,
      image: p.image,
    });
  };

  useEffect(() => {
    const fetchPhones = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("products")
          .select("id,name,price,image,category")
          .eq("category", "phone")
          .order("id", { ascending: false });
        console.log(data);

        if (error) throw error;

        setPhones(data || []);
      } catch (err) {
        console.error("fetchPhones error:", err);
        setPhones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-14">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Điện thoại nổi bật
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Flagship mới nhất, giá tốt, hỗ trợ thu cũ đổi mới.
        </p>
      </div>

      {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phones.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              {/* Image area */}
              <div className="h-[380px] bg-slate-900">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover opacity-80"
                  loading="lazy"
                />
              </div>

              {/* Bottom info */}
              <div className="p-4 border-t border-slate-800/80">
                <Link to={`/product/${product.id}`} key={product.id}>
                <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                </Link>
                <p className="text-sm font-bold text-blue-400 mt-1">
                  {formatPrice(p.price)}
                </p>

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
