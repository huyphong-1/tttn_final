import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiShoppingCart,
} from "react-icons/fi";

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const getStoredOrder = () => {
  try {
    const raw = localStorage.getItem("lastOrder");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Cannot parse stored order:", error);
    return null;
  }
};

export default function PaymentConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(() => location.state?.order || getStoredOrder());

  useEffect(() => {
    if (!order) {
      const stored = getStoredOrder();
      if (stored) {
        setOrder(stored);
        return;
      }
      navigate("/checkout", { replace: true });
    }
  }, [order, navigate]);

  useEffect(() => {
    if (order) {
      try {
        localStorage.setItem("lastOrder", JSON.stringify(order));
      } catch (error) {
        console.warn("Cannot persist order state:", error);
      }
    }
  }, [order]);

  if (!order) {
    return null;
  }

  const estimatedDate = order.estimatedDelivery
    ? new Date(order.estimatedDelivery)
    : null;
  const placedAt = order.placedAt ? new Date(order.placedAt) : null;

  const paymentLabel =
    order.paymentMethod === "cod"
      ? "Thanh toán khi nhận hàng (COD)"
      : "Chuyển khoản ngân hàng";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 md:flex-row md:items-center">
        <div className="p-3 rounded-full bg-green-500/20 text-green-400">
          <FiCheckCircle className="text-2xl" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-400">Đơn hàng #{order.orderNumber}</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Đặt hàng thành công
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Cảm ơn bạn đã mua sắm tại TechPhone. Chúng tôi đã gửi email xác nhận
            tới {order.customer?.email || "email của bạn"}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2 rounded-full border border-slate-600 text-sm text-slate-200 hover:border-blue-500 hover:text-blue-300 transition"
          >
            Quay lại trang trước
          </button>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition"
          >
            <FiShoppingCart className="text-base" />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiTruck className="text-blue-400" />
              Thông tin giao hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<FiUser />} label="Họ & Tên" value={order.customer?.fullName} />
              <InfoRow icon={<FiMail />} label="Email" value={order.customer?.email} />
              <InfoRow icon={<FiPhone />} label="Số điện thoại" value={order.customer?.phone} />
              <InfoRow icon={<FiMapPin />} label="Thành phố" value={order.customer?.city} />
            </div>

            <div className="mt-4 text-sm">
              <span className="text-slate-400 block mb-1">Địa chỉ giao hàng</span>
              <p className="text-white bg-slate-900 border border-slate-700 rounded-lg p-3">
                {order.customer?.address}
              </p>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-3">
              <FiTruck className="text-blue-400 text-xl" />
              <div>
                <p className="text-white font-semibold">Dự kiến giao hàng</p>
                <p className="text-slate-300 text-sm">
                  {estimatedDate
                    ? estimatedDate.toLocaleDateString("vi-VN")
                    : "Liên hệ sau"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiCreditCard className="text-blue-400" />
              Phương thức thanh toán
            </h2>
            <div className="p-4 rounded-xl border border-slate-600 bg-slate-900 flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                <FiCreditCard />
              </div>
              <div>
                <p className="text-white font-medium">{paymentLabel}</p>
                <p className="text-slate-400 text-sm">
                  Tổng thanh toán: {formatPrice(order.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Ghi chú đơn hàng</h2>
            <p className="text-slate-300 text-sm bg-slate-900 border border-slate-700 rounded-lg p-4 min-h-[80px]">
              {order.notes?.trim() ? order.notes : "Không có ghi chú nào cho đơn hàng này."}
            </p>
          </div>
        </div>

        <aside className="bg-slate-800 rounded-2xl border border-slate-700 p-6 h-fit sticky top-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
              <FiFileText className="text-xl" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Tóm tắt đơn hàng</p>
              <p className="text-white font-semibold">#{order.orderNumber}</p>
              {placedAt && (
                <p className="text-slate-400 text-xs">
                  Đặt lúc {placedAt.toLocaleDateString("vi-VN")}{" "}
                  {placedAt.toLocaleTimeString("vi-VN")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-3 border border-slate-700 rounded-xl p-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium line-clamp-2">{item.name}</p>
                  <p className="text-slate-400 text-xs">Số lượng: {item.quantity}</p>
                  <p className="text-blue-400 font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-700 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Tạm tính</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Phí vận chuyển</span>
              <span>{order.shippingFee ? formatPrice(order.shippingFee) : "Miễn phí"}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-white border-t border-slate-700 pt-2">
              <span>Tổng cộng</span>
              <span className="text-blue-400">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              to="/order-history"
              className="block w-full text-center py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              Theo dõi đơn hàng
            </Link>
            <Link
              to="/"
              className="block w-full text-center py-3 rounded-lg border border-slate-600 text-white hover:border-blue-500 transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3 border border-slate-700 rounded-xl bg-slate-900">
      <div className="text-blue-400 mt-1">{icon}</div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
        <p className="text-white text-sm font-medium">{value || "Đang cập nhật"}</p>
      </div>
    </div>
  );
}
