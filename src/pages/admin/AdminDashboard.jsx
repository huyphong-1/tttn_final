import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiTrendingUp,
  FiPackage,
  FiShoppingCart,
  FiStar,
  FiEye
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, ordersAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    totalViews: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats from API
      // This would be implemented with real API calls
      setStats({
        totalUsers: 1250,
        totalOrders: 3420,
        totalRevenue: 125000000,
        totalProducts: 156,
        pendingOrders: 23,
        completedOrders: 3397,
        averageRating: 4.6,
        totalViews: 45230
      });
      
      // Mock recent orders
      setRecentOrders([
        { id: 1, customer: 'Nguyễn Văn A', total: 15000000, status: 'pending', date: '2024-12-25' },
        { id: 2, customer: 'Trần Thị B', total: 8500000, status: 'completed', date: '2024-12-24' },
        { id: 3, customer: 'Lê Văn C', total: 22000000, status: 'processing', date: '2024-12-24' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'processing': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'cancelled': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Không có quyền truy cập</h1>
        <p className="text-slate-300">Bạn không có quyền truy cập vào trang quản trị.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Quản Trị</h1>
        <p className="text-slate-300">Chào mừng trở lại, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Tổng người dùng</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <FiUsers className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <FiShoppingBag className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Doanh thu</p>
              <p className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <FiDollarSign className="text-yellow-500 text-2xl" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Sản phẩm</p>
              <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
            </div>
            <FiPackage className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link 
          to="/admin/products" 
          className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiPackage className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Quản lý sản phẩm</p>
        </Link>

        <Link 
          to="/admin/orders" 
          className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiShoppingCart className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Quản lý đơn hàng</p>
        </Link>

        <Link 
          to="/admin/users" 
          className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiUsers className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Quản lý người dùng</p>
        </Link>

        <Link 
          to="/admin/analytics" 
          className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiTrendingUp className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Thống kê</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Ngày
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
