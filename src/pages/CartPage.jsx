// src/pages/CartPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";


const formatPrice = (n) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const CartPage = () => {
  const { items, updateQty, removeItem, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // nếu không muốn auto redirect khi trống thì bỏ khúc này
    if (items.length === 0) {
      // navigate("/phones");
    }
  }, [items, navigate]);

  if (items.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10 md:py-12 text-slate-50">
        <h1 className="text-2xl md:text-3xl font-semibold mb-3">
          Giỏ hàng của bạn
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          Hiện chưa có sản phẩm nào trong giỏ hàng.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-semibold transition"
        >
          Bắt đầu mua sắm 📱
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 md:py-12 text-slate-50">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">
        Giỏ hàng của bạn
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        {/* List sản phẩm */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="hidden sm:grid grid-cols-5 gap-4 p-4 border-b border-slate-800 text-xs text-slate-400">
              <h2 className="col-span-2 font-semibold uppercase tracking-wider">
                Sản phẩm
              </h2>
              <h2 className="text-center font-semibold uppercase tracking-wider">
                Số lượng
              </h2>
              <h2 className="text-right font-semibold uppercase tracking-wider">
                Giá
              </h2>
              <h2 className="text-right font-semibold uppercase tracking-wider">
                Tổng
              </h2>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center p-4 border-b border-slate-800 last:border-0"
              >
                <div className="col-span-2 flex items-center space-x-4">
                  <img
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md bg-slate-800"
                    src={item.image}
                  />
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-slate-400">
                      Màu: {item.color || "Mặc định"}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="sm:hidden text-xs text-red-400 mt-1"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center border border-slate-700 rounded-full text-xs">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="px-2 py-1 text-slate-300 hover:text-blue-400"
                    >
                      -
                    </button>
                    <span className="px-3 font-medium text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="px-2 py-1 text-slate-300 hover:text-blue-400"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right text-xs sm:text-sm">
                  <span className="sm:hidden text-slate-400 text-[11px]">
                    Giá:{" "}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.price)}
                  </span>
                </div>

                <div className="text-right text-xs sm:text-sm">
                  <span className="sm:hidden text-slate-400 text-[11px]">
                    Tổng:{" "}
                  </span>
                  <span className="font-bold text-blue-400">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="hidden sm:inline-block ml-3 text-slate-500 hover:text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className="px-4 py-3">
              <button
                onClick={clearCart}
                className="text-[11px] text-red-400 hover:text-red-300"
              >
                Xóa toàn bộ giỏ hàng
              </button>
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 sticky top-24">
            <h2 className="text-lg font-bold border-b border-slate-800 pb-4 mb-4">
              Tóm tắt đơn hàng
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Tạm tính</span>
                <span className="font-medium text-slate-100">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Phí vận chuyển</span>
                <span className="font-medium text-emerald-400">Miễn phí</span>
              </div>
            </div>
            <div className="flex justify-between text-base font-bold mt-6 pt-4 border-t border-slate-800">
              <span>Tổng cộng</span>
              <span className="text-blue-400">{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-blue-50 text-white font-bold py-3 rounded-full mt-6 hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Tiến hành thanh toán</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
