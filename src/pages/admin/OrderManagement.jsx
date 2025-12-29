import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FiFilter, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { supabase } from '../../lib/supabase';
import PermissionGuard from '../../components/Guards/PermissionGuard';
import { PERMISSIONS } from '../../config/permissions';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    Number(price || 0)
  );

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-400 bg-yellow-900/20';
    case 'processing':
      return 'text-blue-400 bg-blue-900/20';
    case 'completed':
    case 'delivered':
      return 'text-green-400 bg-green-900/20';
    case 'cancelled':
      return 'text-red-400 bg-red-900/20';
    default:
      return 'text-slate-300 bg-slate-700/40';
  }
};

const getItemsCount = (items) => {
  if (Array.isArray(items)) return items.length;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
      return 0;
    }
  }
  return 0;
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
};

const getDayRange = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

const OrderManagement = () => {
  const { showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

    const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(
          'id, order_number, total_amount, payment_status, status, created_at, customer_name, customer_email, payment_method, items',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        const isNumeric = /^\d+$/.test(debouncedSearch);
        const filters = [];
        if (isNumeric) {
          filters.push(`order_number.eq.${debouncedSearch}`);
        }
        filters.push(`customer_email.ilike.%${debouncedSearch}%`);
        filters.push(`customer_name.ilike.%${debouncedSearch}%`);
        query = query.or(filters.join(','));
      }

      const dateRange = getDayRange(dateFilter);
      const monthValue = monthFilter === 'all' ? null : Number(monthFilter);
      const yearValue = yearFilter === 'all' ? null : Number(yearFilter);

      if (dateRange) {
        const dateMonth = dateRange.start.getMonth() + 1;
        const dateYear = dateRange.start.getFullYear();
        if ((monthValue && monthValue !== dateMonth) || (yearValue && yearValue !== dateYear)) {
          setOrders([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        query = query.gte('created_at', dateRange.start.toISOString())
          .lt('created_at', dateRange.end.toISOString());
      } else if (yearValue) {
        const start = new Date(yearValue, monthValue ? monthValue - 1 : 0, 1);
        const end = new Date(yearValue, monthValue ? monthValue : 0, 1);
        query = query.gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      console.error('OrderManagement fetch error:', error);
      showError('Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, debouncedSearch, dateFilter, monthFilter, yearFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, dateFilter, monthFilter, yearFilter, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalCount, currentPage, pageSize]);

  const filteredOrders = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const dateParts = parseDate(dateFilter);
    const monthValue = monthFilter ? parseInt(monthFilter, 10) : null;
    const yearValue = yearFilter ? parseInt(yearFilter, 10) : null;
    
    return orders.filter((order) => {
      const orderNumber = `${order.order_number || order.id}`.toLowerCase();
      const matchesTerm = term ? orderNumber.includes(term) : true;
      if (!matchesTerm) return false;

      if (!dateParts && !monthValue && !yearValue) return true;
      if (!order.created_at) return false;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      if (dateParts) {
        const [year, month, day] = dateParts;
        if (
          createdAt.getFullYear() !== year ||
          createdAt.getMonth() + 1 !== month ||
          createdAt.getDate() !== day
        ) {
          return false;
        }
      }

      if (monthValue && createdAt.getMonth() + 1 !== monthValue) return false;
      if (yearValue && createdAt.getFullYear() !== yearValue) return false;

      return true;
    });
  }, [orders, debouncedSearch, dateFilter, monthFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedOrders = orders;
  const hasOrders = totalCount > 0;
  const rangeStart = hasOrders ? startIndex + 1 : 0;
  const rangeEnd = hasOrders ? Math.min(startIndex + pageSize, totalCount) : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.ORDER_MANAGE}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý đơn hàng</h1>
            <p className="text-slate-300">Lịch sử đơn hàng trong hệ thống</p>
          </div>
          <button
            onClick={fetchOrders}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiRefreshCw />
            Làm mới
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn hàng..."
                value={searchTerm}
                onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => {
                setDateFilter(event.target.value);
                setCurrentPage(1);
              }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <select
                  value={monthFilter}
                  onChange={(event) => {
                const next = event.target.value;
                setMonthFilter(next);
                if (next !== 'all' && yearFilter === 'all') {
                  setYearFilter(String(new Date().getFullYear()));
                }
                setCurrentPage(1);
              }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả tháng</option>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Tháng {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="number"
                min="2000"
                placeholder="Năm"
                value={yearFilter === 'all' ? '' : yearFilter}
                onChange={(event) => {
                setYearFilter(event.target.value || 'all');
                setCurrentPage(1);
              }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-slate-300 flex items-center">
              Tong: {totalCount} Đơn hàng
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Mã đơn
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
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ngày
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {pagedOrders.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-sm text-slate-400 text-center" colSpan="7">
                      Không có đơn hàng phù hợp
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        #{order.order_number || order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {order.customer_name || order.customer_email || 'Khách hàng ẩn danh'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                        {order.payment_status || 'pending'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                        {getItemsCount(order.items)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('vi-VN')
                          : '--'}
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
                ? `Hiển thị ${rangeStart}-${rangeEnd} / ${totalCount} đơn hàng`
                : 'Không có đơn hàng nào để hiển thị'}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}/page
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || !hasOrders}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-400 transition"
              >
                Trước
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
    </PermissionGuard>
  );
};

export default OrderManagement;
