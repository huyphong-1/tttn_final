import React, { useEffect, useMemo, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import PermissionGuard from '../../components/Guards/PermissionGuard';
import { PERMISSIONS } from '../../config/permissions';
import { useToast } from '../../context/ToastContext';

const CHART_HEIGHT = 180;

const getYearRange = (baseDate = new Date()) => {
  const start = new Date(baseDate.getFullYear(), 0, 1);
  const end = new Date(baseDate.getFullYear() + 1, 0, 1);
  return { start, end };
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    Number(price || 0)
  );

const monthLabels = [
  'T1',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
  'T8',
  'T9',
  'T10',
  'T11',
  'T12'
];

const ProfitManagement = () => {
  const { showError } = useToast();
  const [monthlyTotals, setMonthlyTotals] = useState(Array.from({ length: 12 }, () => 0));
  const [loading, setLoading] = useState(true);

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const { start, end } = getYearRange(currentDate);
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const totals = Array.from({ length: 12 }, () => 0);
      (data || []).forEach((order) => {
        const createdAt = order.created_at ? new Date(order.created_at) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return;
        const monthIndex = createdAt.getMonth();
        totals[monthIndex] += Number(order.total_amount || 0);
      });

      setMonthlyTotals(totals);
    } catch (error) {
      console.error('ProfitManagement fetch error:', error);
      showError('Không thể tải dữ liệu doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const totalRevenue = monthlyTotals.reduce((sum, value) => sum + value, 0);
  const currentMonthRevenue = monthlyTotals[currentMonthIndex] || 0;
  const maxValue = Math.max(...monthlyTotals, 1);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Đang tải dữ liệu doanh thu...</p>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.ANALYTICS_VIEW}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Doanh thu theo tháng</h1>
            <p className="text-slate-300">Tổng quan doanh thu năm {currentYear}</p>
          </div>
          <button
            onClick={fetchRevenue}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiTrendingUp />
            Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Doanh thu năm {currentYear}</p>
            <p className="text-2xl font-bold text-white">{formatPrice(totalRevenue)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">
              Doanh thu tháng {currentMonthIndex + 1}/{currentYear}
            </p>
            <p className="text-2xl font-bold text-white">{formatPrice(currentMonthRevenue)}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-end gap-3 h-[220px]">
            {monthlyTotals.map((value, index) => {
              const height = Math.max(6, (value / maxValue) * CHART_HEIGHT);
              const isCurrent = index === currentMonthIndex;
              return (
                <div key={monthLabels[index]} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-lg ${
                      isCurrent ? 'bg-blue-500/80' : 'bg-slate-600/60'
                    }`}
                    style={{ height }}
                    title={formatPrice(value)}
                  />
                  <span className="text-xs text-slate-400">{monthLabels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Chi tiết doanh thu</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
            {monthlyTotals.map((value, index) => (
              <div key={`detail-${monthLabels[index]}`} className="bg-slate-900/60 rounded-lg p-4">
                <p className="text-xs text-slate-400">Tháng {index + 1}</p>
                <p className="text-sm font-semibold text-white">{formatPrice(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ProfitManagement;
