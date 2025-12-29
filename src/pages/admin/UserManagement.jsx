import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiFilter,
  FiUserPlus,
  FiShield,
  FiMail,
  FiSave,
  FiX
} from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ROLES, PERMISSIONS } from '../../config/permissions';
import PermissionGuard from '../../components/Guards/PermissionGuard';
import { supabase } from '../../lib/supabase';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const UserManagement = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: ROLES.USER,
    status: 'active',
    password: '',
    confirm_password: ''
  });

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, filterRole, debouncedSearch]);

  useEffect(() => {
    setSelectedUsers([]);
  }, [currentPage, pageSize, filterRole, debouncedSearch]);

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: ROLES.USER,
      status: 'active',
      password: '',
      confirm_password: ''
    });
    setEditingUser(null);
    setShowModal(false);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      full_name: '',
      role: ROLES.USER,
      status: 'active',
      password: '',
      confirm_password: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      email: targetUser.email || '',
      full_name: targetUser.full_name || '',
      role: targetUser.role || ROLES.USER,
      status: targetUser.status || 'active',
      password: '',
      confirm_password: ''
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    const email = (formData.email || '').trim().toLowerCase();
    const fullName = formData.full_name.trim();
    const role = formData.role || ROLES.USER;
    const status = formData.status || 'active';
    const isEditing = Boolean(editingUser);

    if (!isEditing) {
      if (!email) {
        showError('Vui lòng nhập email');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Email không hợp lệ');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        showError('Mật khẩu xác nhận không khớp');
        return;
      }
    }

    try {
      setSaving(true);

      if (isEditing) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName, role, status })
          .eq('id', editingUser.id);

        if (error) throw error;

        setUsers(prev =>
          prev.map(user =>
            user.id === editingUser.id ? { ...user, full_name: fullName, role, status } : user
          )
        );
        showSuccess('Cập nhật người dùng thành công!');
      } else {
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email,
            password: formData.password,
            full_name: fullName,
            role,
            status
          }
        });

        if (error) throw error;
        if (!data?.user?.id) {
          throw new Error('Khong the tao nguoi dung');
        }

        await fetchUsers();
        showSuccess('Them nguoi dung thanh cong!');
      }

      resetForm();
    } catch (error) {
      console.error(error);
      showError(error.message || 'Có lỗi xảy ra khi lưu người dùng');
    } finally {
      setSaving(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let profileQuery = supabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at, last_login', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filterRole !== 'all') {
        profileQuery = profileQuery.eq('role', filterRole);
      }

      if (debouncedSearch) {
        profileQuery = profileQuery.or(`email.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: profileData, error: profileError, count } = await profileQuery.range(from, to);

      if (profileError) throw profileError;
      setTotalCount(typeof count === 'number' ? count : 0);

      const userIds = (profileData || []).map((profile) => profile.id).filter(Boolean);
      let ordersData = [];

      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('orders')
          .select('user_id, total_amount')
          .in('user_id', userIds);

        if (error) throw error;
        ordersData = data || [];
      }

      const orderMap = (ordersData || []).reduce((acc, order) => {
        const key = order.user_id;
        if (!key) return acc;
        if (!acc[key]) acc[key] = { count: 0, total: 0 };
        acc[key].count += 1;
        acc[key].total += Number(order.total_amount || 0);
        return acc;
      }, {});

      const normalizedUsers = (profileData || []).map((profile) => ({
        ...profile,
        role: profile.role || ROLES.USER,
        status: profile.status || 'active',
        orders_count: orderMap[profile.id]?.count || 0,
        total_spent: orderMap[profile.id]?.total || 0
      }));

      setUsers(normalizedUsers);
    } catch (error) {
      console.error(error);
      showError('Có lỗi xảy ra khi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;

      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      showSuccess('Cập nhât quyền người dùng thành công!');
    } catch (error) {
      console.error(error);
      showError('Lỗi khi cập nhật quyền người dùng');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      if (error) throw error;

      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      );
      setUsers(updatedUsers);
      showSuccess(
        `${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hoá'} người dùng thành công`
      );
    } catch (error) {
      console.error(error);
      showError('Có lỗi xảy ra khi cập nhật trạng thái người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        setUsers(prev => prev.filter(user => user.id !== userId));
        showSuccess('Xoá người dùng thành công');
      } catch (error) {
        console.error(error);
        showError('Có lỗi xảy ra khi xoá người dùng');
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showError('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    try {
      switch (action) {
        case 'activate': {
          const { error } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .in('id', selectedUsers);
          if (error) throw error;
          setUsers(prev =>
            prev.map(user =>
              selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
            )
          );
          showSuccess('Kích hoạt người dùng thành công');
          break;
        }
        case 'deactivate': {
          const { error } = await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .in('id', selectedUsers);
          if (error) throw error;
          setUsers(prev =>
            prev.map(user =>
              selectedUsers.includes(user.id) ? { ...user, status: 'inactive' } : user
            )
          );
          showSuccess('Vô hiệu hoá người dùng thành công');
          break;
        }
        case 'delete': {
          if (window.confirm('Bạn có chắc chắn muốn xóa các người dùng đã chọn?')) {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .in('id', selectedUsers);
            if (error) throw error;
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            showSuccess('Xoá người dùng thành công');
          }
          break;
        }
      }
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
      showError('Có lỗi xảy ra khi thao tác');
    }
  };

  const filteredUsers = users;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN: return 'text-purple-400 bg-purple-900/20';
      case ROLES.USER: return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-400 bg-green-900/20'
      : 'text-red-400 bg-red-900/20';
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Đang tải người dùng...</p>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.USER_MANAGE}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý người dùng</h1>
            <p className="text-slate-300">Quản lý tài khoản và quyền người dùng</p>
          </div>
          
          <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
            <button
              onClick={openCreateModal}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiUserPlus />
              Thêm người dùng
            </button>
          </PermissionGuard>
        </div>

        {/* Filters & Search */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterRole}
                onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả quyền</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.USER}>User</option>
              </select>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs transition-colors"
                >
                  Kích hoạt
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs transition-colors"
                >
                  Vô hiệu hóa
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs transition-colors"
                >
                  Xóa
                </button>
              </div>
            )}

            <div className="text-slate-300 flex items-center">
              Tong: {totalCount} nguoi dung
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(user => user.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Quyền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tổng chi tiêu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Đăng nhập cuối
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center mr-4">
                          <FiUsers className="text-slate-300" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.full_name || 'Chưa cập nhật'}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PermissionGuard permission={PERMISSIONS.ROLE_MANAGE}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${getRoleColor(user.role)}`}
                        >
                          <option value={ROLES.ADMIN}>Admin</option>
                          <option value={ROLES.USER}>User</option>
                        </select>
                      </PermissionGuard>
                      <PermissionGuard 
                        permission={PERMISSIONS.ROLE_MANAGE}
                        fallback={
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        }
                        showFallback={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {user.orders_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatPrice(user.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission={PERMISSIONS.USER_UPDATE}>
                          <button
                            onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                            className={`p-1 rounded ${user.status === 'active' ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                            title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            <FiShield />
                          </button>
                        </PermissionGuard>

                        <PermissionGuard permission={PERMISSIONS.USER_UPDATE}>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 />
                          </button>
                        </PermissionGuard>

                        <PermissionGuard permission={PERMISSIONS.USER_DELETE}>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Xóa"
                          >
                            <FiTrash2 />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              {totalCount > 0
                ? `Hiển thị ${rangeStart}-${rangeEnd} / ${totalCount} người dùng`
                : 'Không có người dùng để hiển thị'}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
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
                disabled={currentPage === 1 || totalCount === 0}
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
                disabled={currentPage === totalPages || totalCount === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-400 transition"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                </h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-white">
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      disabled={Boolean(editingUser)}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mật khẩu *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Xác nhận mật khẩu *
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      QUYỀN
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={ROLES.ADMIN}>Admin</option>
                      <option value={ROLES.USER}>User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Trang thai
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Vô hiệu hoá</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Huy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 disabled:opacity-60"
                  >
                    <FiSave />
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;
