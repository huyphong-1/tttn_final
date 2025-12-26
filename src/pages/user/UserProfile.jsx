import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiEdit2, 
  FiSave,
  FiX,
  FiShoppingBag,
  FiHeart,
  FiSettings,
  FiLock,
  FiCamera
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI } from '../../services/api';
import { validateUserProfile } from '../../utils/validation';
import { getOrdersByUser, supabase } from '../../lib/supabase';

const UserProfile = () => {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    avatar_url: '',
    date_of_birth: '',
    gender: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [orderStats, setOrderStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_spent: 0
  });
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        avatar_url: profile.avatar_url || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || ''
      });
    }
  }, [profile]);

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      setOrdersLoading(true);
      const orders = await getOrdersByUser(user.id);
      setUserOrders(orders || []);
      const totalOrders = orders?.length || 0;
      const pendingOrders = (orders || []).filter((order) =>
        ['pending', 'processing'].includes(order.status)
      ).length;
      const completedOrders = (orders || []).filter((order) =>
        ['completed', 'delivered'].includes(order.status)
      ).length;
      const totalSpent = (orders || []).reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      );
      setOrderStats({
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        total_spent: totalSpent
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          fetchUserStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserStats]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      validateUserProfile(profileData);

      // API call to update profile
      // await usersAPI.updateUserProfile(user.id, profileData);
      
      showSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (error) {
      showError(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      if (passwordData.new_password !== passwordData.confirm_password) {
        showError('Mật khẩu xác nhận không khớp');
        return;
      }

      if (passwordData.new_password.length < 6) {
        showError('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      setLoading(true);
      // API call to change password
      showSuccess('Đổi mật khẩu thành công!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      showError(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
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

  const StatusPill = ({ label, value }) => (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: FiUser },
    { id: 'orders', label: 'Đơn hàng', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Yêu thích', icon: FiHeart },
    { id: 'security', label: 'Bảo mật', icon: FiLock }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
              {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-3xl text-slate-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors">
              <FiCamera className="text-sm" />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              {profileData.full_name || user?.email || 'Người dùng'}
            </h1>
            <p className="text-slate-300 mb-4">{user?.email}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{orderStats.total_orders}</div>
                <div className="text-xs text-slate-400">Tổng đơn hàng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{orderStats.pending_orders}</div>
                <div className="text-xs text-slate-400">Đang xử lý</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{orderStats.completed_orders}</div>
                <div className="text-xs text-slate-400">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{formatPrice(orderStats.total_spent)}</div>
                <div className="text-xs text-slate-400">Tổng chi tiêu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Thông tin cá nhân</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {isEditing ? <FiX /> : <FiEdit2 />}
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={profileData.date_of_birth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <FiSave />
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Lịch sử đơn hàng</h2>
            {ordersLoading ? (
              <div className="text-center py-12 text-slate-400">
                Đang tải đơn hàng...
              </div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FiShoppingBag className="text-4xl text-slate-500 mx-auto mb-4" />
                <p>Chưa có đơn hàng nào</p>
                <Link
                  to="/phones"
                  className="inline-flex mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-slate-700 rounded-2xl bg-slate-900/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-slate-400">Đơn hàng #{order.order_number || order.id}</p>
                      <p className="text-white font-semibold">{formatPrice(order.total_amount)}</p>
                      <p className="text-xs text-slate-500">
                        {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '--'}
                      </p>
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                      <StatusPill label="Trạng thái" value={order.status || 'pending'} />
                      <StatusPill label="Thanh toán" value={order.payment_status || 'pending'} />
                      <StatusPill label="Phương thức" value={order.payment_method || 'cod'} />
                    </div>
                    {order.items?.length ? (
                      <div className="text-xs text-slate-400">
                        {order.items.length} sản phẩm
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Sản phẩm yêu thích</h2>
            <div className="text-center py-12">
              <FiHeart className="text-4xl text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Chưa có sản phẩm yêu thích nào</p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Đổi mật khẩu</h2>
            
            <form onSubmit={handleChangePassword} className="max-w-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
