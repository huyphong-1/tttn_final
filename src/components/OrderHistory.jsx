
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOrders, getOrdersByUser } from '../lib/supabase';

const OrderHistory = () => {
  const { user, profile } = useAuth();
  const { showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = isAdmin ? await getOrders() : await getOrdersByUser(user.id);
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Khong the tai lich su don hang.');
        showError?.('Khong the tai lich su don hang');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id, isAdmin, showError]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price || 0));

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-300">
        Dang tai lich su don hang...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Lich su don hang</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isAdmin ? 'Danh sach toan bo don hang trong he thong.' : 'Don hang ban da dat.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p>{isAdmin ? 'Chua co don hang nao.' : 'Ban chua co don hang nao.'}</p>
          {!isAdmin && (
            <Link to="/phones" className="inline-flex mt-4 px-4 py-2 bg-blue-600 rounded-full text-sm">
              Mua sam ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Don hang #{order.order_number || order.id}</p>
                {isAdmin && (
                  <p className="text-xs text-slate-500">
                    {order.customer_name || order.customer_email || 'Khach hang an danh'}
                  </p>
                )}
                <p className="text-white font-semibold">{formatPrice(order.total_amount)}</p>
                <p className="text-xs text-slate-500">
                  {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '--'}
                </p>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatusTag label="Trang thai" value={order.status || 'pending'} />
                <StatusTag label="Thanh toan" value={order.payment_status || 'pending'} />
                <StatusTag label="Phuong thuc" value={order.payment_method || 'cod'} />
              </div>
              {order.items?.length ? (
                <div className="text-xs text-slate-400">
                  {order.items.length} san pham
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusTag = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-white">{value}</p>
  </div>
);

export default OrderHistory;
