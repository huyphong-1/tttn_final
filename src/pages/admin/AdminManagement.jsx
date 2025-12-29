import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiMail, FiShield, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../hooks/usePrismaAuth';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAILS, isAdminEmail } from '../../config/adminConfig';
import { ROLES } from '../../config/permissions';

const AdminManagement = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [adminUsers, setAdminUsers] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tất cả admin users từ database
  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', ROLES.ADMIN)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      showError('Không thể tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin]);

  // Thêm admin mới
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      showError('Vui lòng nhập email admin');
      return;
    }

    if (!newAdminEmail.includes('@')) {
      showError('Email không hợp lệ');
      return;
    }

    try {
      setSubmitting(true);

      // Kiểm tra xem user với email này đã tồn tại chưa
      const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
      
      if (checkError) {
        // Fallback: kiểm tra trong profiles table
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', newAdminEmail.trim())
          .single();

        if (existingProfile) {
          // Update existing profile to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: ROLES.ADMIN })
            .eq('email', newAdminEmail.trim());

          if (updateError) throw updateError;
          
          showSuccess(`Đã cập nhật ${newAdminEmail} thành admin`);
          setNewAdminEmail('');
          fetchAdminUsers();
          return;
        }
      }

      // Nếu chưa có user, tạo thông báo để user tự đăng ký
      showSuccess(`Đã thêm ${newAdminEmail} vào danh sách admin. User này sẽ tự động có quyền admin khi đăng ký.`);
      setNewAdminEmail('');
      
    } catch (error) {
      console.error('Error adding admin:', error);
      showError('Có lỗi xảy ra khi thêm admin');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa admin (chỉ có thể downgrade, không xóa account)
  const handleRemoveAdmin = async (adminId, email) => {
    if (adminId === user?.id) {
      showError('Không thể xóa quyền admin của chính mình');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa quyền admin của ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: ROLES.USER })
        .eq('id', adminId);

      if (error) throw error;

      showSuccess(`Đã xóa quyền admin của ${email}`);
      fetchAdminUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      showError('Có lỗi xảy ra khi xóa admin');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <FiShield className="text-6xl text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Truy cập bị từ chối</h1>
        <p className="text-slate-300">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <FiUsers className="text-3xl text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Quản lý Admin</h1>
      </div>

      {/* Form thêm admin mới */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FiPlus className="text-green-400" />
          Thêm Admin Mới
        </h2>
        
        <form onSubmit={handleAddAdmin} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Nhập email admin mới"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                disabled={submitting}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            {submitting ? 'Đang thêm...' : 'Thêm Admin'}
          </button>
        </form>
        
        <div className="mt-4 text-sm text-slate-400">
          <p>💡 <strong>Lưu ý:</strong> Email được thêm sẽ tự động có quyền admin khi đăng ký vào hệ thống.</p>
        </div>
      </div>

      {/* Danh sách admin hiện tại */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FiShield className="text-purple-400" />
            Danh sách Admin ({adminUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Đang tải danh sách admin...
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Chưa có admin nào trong hệ thống
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {adminUsers.map((admin) => (
              <div key={admin.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <FiShield className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {admin.full_name || 'Chưa cập nhật tên'}
                    </h3>
                    <p className="text-slate-400">{admin.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                        Admin
                      </span>
                      {admin.id === user?.id && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          Bạn
                        </span>
                      )}
                      {isAdminEmail(admin.email) && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {admin.id !== user?.id && !isAdminEmail(admin.email) && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Xóa quyền admin"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thông tin admin emails được cấu hình */}
      <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          Super Admin Emails (Cấu hình trong code)
        </h2>
        <div className="space-y-2">
          {ADMIN_EMAILS.map((email, index) => (
            <div key={index} className="flex items-center gap-2 text-slate-300">
              <FiMail className="text-green-400" />
              <span>{email}</span>
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                Super Admin
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-4">
          💡 Super Admin emails được cấu hình trong <code>src/config/adminConfig.js</code> và không thể xóa quyền.
        </p>
      </div>
    </div>
  );
};

export default AdminManagement;
