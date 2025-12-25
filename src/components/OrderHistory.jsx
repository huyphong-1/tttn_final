import React, { useState, useEffect } from 'react';
import { getOrders } from '../lib/supabase';  // Import hàm lấy đơn hàng từ supabase.js
import { Link } from "react-router-dom";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Lấy danh sách đơn hàng khi component được render
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getOrders();  // Gọi hàm getOrders từ supabase.js
        setOrders(data);
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Lịch sử Đơn hàng</h1>
      {orders.length === 0 ? (
        <p>Không có đơn hàng nào.</p>
      ) : (
        <ul>
          {orders.map(order => (
            <li key={order.id}>
              <Link to={`/order/${order.id}`}>
                <strong>Đơn hàng #{order.id}</strong>
              </Link>
              <div>Tổng tiền: {order.total_amount} VNĐ</div>
              <div>Phí vận chuyển: {order.shipping_fee} VNĐ</div>
              <div>Trạng thái thanh toán: {order.payment_status}</div>
              <div>Trạng thái đơn hàng: {order.status}</div>
              <div>Ngày tạo: {new Date(order.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;
