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
      // Mock data - replace with real API call
      const mockUsers = [
        {
          id: 1,
          email: 'admin@techphone.com',
          full_name: 'Admin User',
          role: ROLES.ADMIN,
          status: 'active',
          created_at: '2024-01-15',
          last_login: '2024-12-25',
          orders_count: 0,
          total_spent: 0
        },
        {
          id: 2,
          email: 'user1@example.com',
          full_name: 'Nguyễn Văn A',
          role: ROLES.USER,
          status: 'active',
          created_at: '2024-02-20',
          last_login: '2024-12-24',
          orders_count: 5,
          total_spent: 15000000
        },
        {
          id: 3,
          email: 'user2@example.com',
          full_name: 'Trần Thị B',
          role: ROLES.USER,
          status: 'inactive',
          created_at: '2024-03-10',
          last_login: '2024-12-20',
          orders_count: 2,
          total_spent: 8500000
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      showError('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // API call to update user role
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      showSuccess('Cập nhật quyền người dùng thành công!');
    } catch (error) {
      showError('Lỗi khi cập nhật quyền người dùng');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      );
      setUsers(updatedUsers);
      showSuccess(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công!`);
    } catch (error) {
      showError('Lỗi khi cập nhật trạng thái người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        setUsers(prev => prev.filter(user => user.id !== userId));
        showSuccess('Xóa người dùng thành công!');
      } catch (error) {
        showError('Lỗi khi xóa người dùng');
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
        case 'activate':
          setUsers(prev => prev.map(user => 
            selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
          ));
          showSuccess(`Kích hoạt ${selectedUsers.length} người dùng thành công!`);
          break;
        case 'deactivate':
          setUsers(prev => prev.map(user => 
            selectedUsers.includes(user.id) ? { ...user, status: 'inactive' } : user
          ));
          showSuccess(`Vô hiệu hóa ${selectedUsers.length} người dùng thành công!`);
          break;
        case 'delete':
          if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedUsers.length} người dùng?`)) {
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            showSuccess(`Xóa ${selectedUsers.length} người dùng thành công!`);
          }
          break;
      }
      setSelectedUsers([]);
    } catch (error) {
      showError('Lỗi khi thực hiện thao tác');
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
