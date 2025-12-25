import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Để lấy ID đơn hàng từ URL
import { getOrderStatus, getOrderTracking } from '../lib/supabase'; // Nhập các hàm lấy dữ liệu từ supabase.js

const OrderDetail = () => {
  const { orderId } = useParams();  // Lấy ID đơn hàng từ URL
  const [orderStatus, setOrderStatus] = useState([]);
  const [orderTracking, setOrderTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Hàm lấy trạng thái và thông tin theo dõi của đơn hàng
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const statusData = await getOrderStatus(orderId);  // Lấy trạng thái đơn hàng
        setOrderStatus(statusData);

        const trackingData = await getOrderTracking(orderId);  // Lấy thông tin theo dõi đơn hàng
        setOrderTracking(trackingData);
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Chi tiết Đơn hàng #{orderId}</h2>

      <h3>Trạng thái Đơn hàng</h3>
      {orderStatus.length === 0 ? (
        <p>Không có thông tin trạng thái.</p>
      ) : (
        <ul>
          {orderStatus.map((status) => (
            <li key={status.updated_at}>
              <div>Trạng thái: {status.status}</div>
              <div>Ngày cập nhật: {new Date(status.updated_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}

      <h3>Thông tin Theo dõi Đơn hàng</h3>
      {orderTracking.length === 0 ? (
        <p>Không có thông tin theo dõi.</p>
      ) : (
        <ul>
          {orderTracking.map((tracking) => (
            <li key={tracking.tracking_number}>
              <div>Số theo dõi: {tracking.tracking_number}</div>
              <div>Trạng thái hiện tại: {tracking.current_status}</div>
              <div>
                <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer">Theo dõi tại đây</a>
              </div>
              <div>Ngày cập nhật: {new Date(tracking.updated_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderDetail;
