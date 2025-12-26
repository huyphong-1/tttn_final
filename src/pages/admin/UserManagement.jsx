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
  FiCalendar,
  FiMoreVertical
} from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, PERMISSIONS } from '../../config/permissions';
import PermissionGuard from '../../components/Guards/PermissionGuard';
import { supabase } from '../../lib/supabase';

const UserManagement = () => {
  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [
        { data: profileData, error: profileError },
        { data: ordersData, error: ordersError }
      ] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role, status, created_at, last_login'),
        supabase.from('orders').select('id, user_id, total_amount, status')
      ]);

      if (profileError) throw profileError;
      if (ordersError) throw ordersError;

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
      showError('L?i khi t?i danh s?ch ng??i d?ng');
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
      showSuccess('C?p nh?t quy?n ng??i d?ng th?nh c?ng!');
    } catch (error) {
      console.error(error);
      showError('L?i khi c?p nh?t quy?n ng??i d?ng');
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
        `${newStatus === 'active' ? 'Kich hoat' : 'Vo hieu hoa'} nguoi dung thanh cong!`
      );
    } catch (error) {
      console.error(error);
      showError('L?i khi c?p nh?t tr?ng th?i ng??i d?ng');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('B?n c? ch?c ch?n mu?n x?a ng??i d?ng n?y?')) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        setUsers(prev => prev.filter(user => user.id !== userId));
        showSuccess('X?a ng??i d?ng th?nh c?ng!');
      } catch (error) {
        console.error(error);
        showError('L?i khi x?a ng??i d?ng');
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showError('Vui l?ng ch?n ?t nh?t m?t ng??i d?ng');
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
          showSuccess('Kich hoat nguoi dung thanh cong!');
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
          showSuccess('Vo hieu hoa nguoi dung thanh cong!');
          break;
        }
        case 'delete': {
          if (window.confirm('Ban co chac chan muon xoa nguoi dung?')) {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .in('id', selectedUsers);
            if (error) throw error;
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            showSuccess('Xoa nguoi dung thanh cong!');
          }
          break;
        }
      }
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
      showError('L?i khi th?c hi?n thao t?c');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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
              onClick={() => setShowModal(true)}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
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
              Tổng: {filteredUsers.length} người dùng
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
        </div>
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;
