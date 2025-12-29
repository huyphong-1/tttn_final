import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../hooks/usePrismaAuth';
import { supabase } from '../../lib/supabase';

const isSameDay = (value, baseDate = new Date()) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  );
};

const getMonthRange = (baseDate = new Date()) => {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return { start, end };
};

const getDayRange = (baseDate = new Date()) => {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

const isInCurrentMonth = (value, baseDate = new Date()) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth()
  );
};

const isPendingStatus = (status) => ['pending', 'processing'].includes(status);
const isCompletedStatus = (status) => ['completed', 'delivered'].includes(status);

const PAGE_SIZE = 10;
const METRICS_ROW_ID = 'global-dashboard-metrics';
const POLLING_INTERVAL_MS = 30000;

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
    totalViews: 0,
    ordersToday: 0,
    loginsToday: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersCount, setRecentOrdersCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const currentPageRef = useRef(1);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const fetchRecentOrders = useCallback(async (page = currentPageRef.current) => {
    try {
      const { start, end } = getMonthRange(new Date());
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, customer_name, customer_email', { count: 'exact' })
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedOrders = (data || []).map((order) => ({
        id: order.id,
        customer: order.customer_name || order.customer_email || 'Khach hang an danh',
        total: order.total_amount || 0,
        status: order.status || 'pending',
        date: order.created_at
          ? new Date(order.created_at).toLocaleDateString('vi-VN')
          : '--'
      }));

      setRecentOrders(formattedOrders);
      setRecentOrdersCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  }, []);

  const fetchStats = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const now = new Date();
      const { start: dayStart, end: dayEnd } = getDayRange(now);

      let productResponse = await supabase
        .from('products')
        .select('rating, view_count', { count: 'exact' });

      if (productResponse.error?.code === '42703') {
        productResponse = await supabase
          .from('products')
          .select('rating', { count: 'exact' });
      }

      const [
        { data: metricsData, error: metricsError },
        { count: totalUsersCount, error: usersError },
        { count: totalOrdersCount, error: ordersError },
        { count: pendingCount, error: pendingError },
        { count: completedCount, error: completedError },
        { count: ordersTodayCount, error: ordersTodayError },
        { count: loginsTodayCount, error: loginsTodayError }
      ] = await Promise.all([
        supabase
          .from('dashboard_metrics')
          .select('total_users,total_orders,total_revenue')
          .eq('id', METRICS_ROW_ID)
          .maybeSingle(),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'processing']),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['completed', 'delivered']),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('last_login', dayStart.toISOString())
          .lt('last_login', dayEnd.toISOString())
      ]);

      if (productResponse.error) throw productResponse.error;
      if (usersError) throw usersError;
      if (ordersError) throw ordersError;
      if (pendingError) throw pendingError;
      if (completedError) throw completedError;
      if (ordersTodayError) throw ordersTodayError;
      if (loginsTodayError) throw loginsTodayError;
      if (metricsError && !['PGRST116', 'PGRST205'].includes(metricsError.code)) {
        throw metricsError;
      }

      const productData = productResponse.data || [];
      const totalProducts =
        typeof productResponse.count === 'number'
          ? productResponse.count
          : productData.length;
      const totalUsers = Number(metricsData?.total_users ?? totalUsersCount ?? 0);
      const totalOrders = Number(metricsData?.total_orders ?? totalOrdersCount ?? 0);
      let totalRevenue = metricsData?.total_revenue;

      if (totalRevenue === null || typeof totalRevenue === 'undefined') {
        const { data: revenueData, error: revenueError } = await supabase
          .from('orders')
          .select('total_amount');
        if (revenueError) throw revenueError;
        totalRevenue = (revenueData || []).reduce(
          (sum, order) => sum + Number(order.total_amount || 0),
          0
        );
      }

      const averageRating =
        productData.length
          ? (
              productData.reduce((sum, product) => sum + Number(product.rating || 0), 0) /
              productData.length
            ).toFixed(1)
          : 0;

      const totalViews = productData.reduce((sum, product) => {
        return sum + Number(product.view_count ?? 0);
      }, 0);

      setStats({
        totalUsers,
        totalOrders,
        totalRevenue: Number(totalRevenue || 0),
        totalProducts,
        pendingOrders: Number(pendingCount || 0),
        completedOrders: Number(completedCount || 0),
        averageRating: Number(averageRating),
        totalViews,
        ordersToday: Number(ordersTodayCount || 0),
        loginsToday: Number(loginsTodayCount || 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isAdmin) {
      fetchStats(true);
      fetchRecentOrders();
    }
  }, [isAdmin, fetchStats, fetchRecentOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    const intervalId = setInterval(() => {
      fetchStats();
      fetchRecentOrders(currentPageRef.current);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAdmin, fetchStats, fetchRecentOrders]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(recentOrdersCount / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [recentOrdersCount, currentPage]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRecentOrders(currentPage);
  }, [isAdmin, currentPage, fetchRecentOrders]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-dashboard-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const hasLoginToday = isSameDay(payload.new?.last_login, new Date());
          setStats((prev) => ({
            ...prev,
            totalUsers: prev.totalUsers + 1,
            loginsToday: hasLoginToday ? prev.loginsToday + 1 : prev.loginsToday
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const amount = Number(payload.new?.total_amount || 0);
          const status = payload.new?.status || 'pending';
          const placedToday = isSameDay(payload.new?.created_at, new Date());

          setStats((prev) => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
            totalRevenue: prev.totalRevenue + amount,
            pendingOrders: isPendingStatus(status) ? prev.pendingOrders + 1 : prev.pendingOrders,
            completedOrders: isCompletedStatus(status) ? prev.completedOrders + 1 : prev.completedOrders,
            ordersToday: placedToday ? prev.ordersToday + 1 : prev.ordersToday
          }));

          if (isInCurrentMonth(payload.new?.created_at, new Date())) {
            const formatted = {
              id: payload.new?.id,
              customer:
                payload.new?.customer_name ||
                payload.new?.customer_email ||
                'Khach hang an danh',
              total: payload.new?.total_amount || 0,
              status: payload.new?.status || 'pending',
              date: payload.new?.created_at
                ? new Date(payload.new.created_at).toLocaleDateString('vi-VN')
                : '--'
            };

            setRecentOrdersCount((prev) => prev + 1);
            if (currentPageRef.current === 1) {
              setRecentOrders((prev) =>
                [formatted, ...prev.filter((order) => order.id !== formatted.id)].slice(0, PAGE_SIZE)
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          const oldAmount = Number(payload.old?.total_amount || 0);
          const newAmount = Number(payload.new?.total_amount || 0);
          const isCurrentMonth = isInCurrentMonth(payload.new?.created_at, new Date());

          setStats((prev) => {
            let pending = prev.pendingOrders;
            let completed = prev.completedOrders;

            if (isPendingStatus(oldStatus)) pending = Math.max(0, pending - 1);
            if (isCompletedStatus(oldStatus)) completed = Math.max(0, completed - 1);

            if (isPendingStatus(newStatus)) pending += 1;
            if (isCompletedStatus(newStatus)) completed += 1;

            return {
              ...prev,
              pendingOrders: pending,
              completedOrders: completed,
              totalRevenue: prev.totalRevenue + (newAmount - oldAmount)
            };
          });

          setRecentOrders((prev) => {
            if (!isCurrentMonth) {
              return prev.filter((order) => order.id !== payload.new?.id);
            }

            return prev.map((order) =>
              order.id === payload.new?.id
                ? {
                    ...order,
                    total: payload.new?.total_amount || order.total,
                    status: payload.new?.status || order.status,
                    date: payload.new?.created_at
                      ? new Date(payload.new.created_at).toLocaleDateString('vi-VN')
                      : order.date
                  }
                : order
            );
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const lastLoginChanged = payload.new?.last_login !== payload.old?.last_login;
          if (!lastLoginChanged) return;

          const now = new Date();
          const wasToday = isSameDay(payload.old?.last_login, now);
          const isToday = isSameDay(payload.new?.last_login, now);

          if (wasToday === isToday) return;

          setStats((prev) => {
            const delta = isToday ? 1 : -1;
            return {
              ...prev,
              loginsToday: Math.max(0, prev.loginsToday + delta)
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_metrics',
          filter: `id=eq.${METRICS_ROW_ID}`
        },
        (payload) => {
          if (!payload.new) return;
          setStats((prev) => ({
            ...prev,
            totalUsers: Number(payload.new.total_users || 0),
            totalOrders: Number(payload.new.total_orders || 0),
            totalRevenue: Number(payload.new.total_revenue || 0)
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

    

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

  const totalPages = Math.max(1, Math.ceil(recentOrdersCount / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedOrders = recentOrders;
  const hasOrders = recentOrdersCount > 0;
  const rangeStart = hasOrders ? startIndex + 1 : 0;
  const rangeEnd = hasOrders ? Math.min(startIndex + PAGE_SIZE, recentOrdersCount) : 0;

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
              <p className="text-slate-400 text-sm">Đăng nhập hôm nay</p>
              <p className="text-2xl font-bold text-white">{stats.loginsToday.toLocaleString()}</p>
            </div>
            <FiEye className="text-cyan-500 text-2xl" />
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
              <p className="text-slate-400 text-sm">Đơn hàng hôm nay</p>
              <p className="text-2xl font-bold text-white">{stats.ordersToday.toLocaleString()}</p>
            </div>
            <FiShoppingCart className="text-emerald-500 text-2xl" />
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
          to="/admin/cart" 
          className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiShoppingCart className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Quản lý đơn hàng</p>
        </Link>

        <Link 
          to="/admin/user" 
          className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiUsers className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Quản lý người dùng</p>
        </Link>

        <Link 
          to="/admin/profit" 
          className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition-colors"
        >
          <FiTrendingUp className="text-2xl mx-auto mb-2" />
          <p className="font-medium">Thống kê</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Don hang gan day</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Khach hang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Tong tien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Trang thai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Ngay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {pagedOrders.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-400 text-center" colSpan="5">
                    Khong co don hang
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {hasOrders
              ? `Hien thi ${rangeStart}-${rangeEnd} / ${recentOrdersCount} don hang`
              : 'Khong co don hang'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || !hasOrders}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-400 transition"
            >
              Truoc
            </button>
            <span className="text-sm text-slate-300">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || !hasOrders}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-400 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
