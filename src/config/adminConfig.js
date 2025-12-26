// Cấu hình admin emails - dễ dàng thêm/xóa admin mới
export const ADMIN_EMAILS = [
  'admin@techphone.com',
  'php2706@gmail.com',
  // Thêm admin emails mới ở đây
];

// Kiểm tra xem email có phải admin không
export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Lấy danh sách admin emails
export const getAdminEmails = () => [...ADMIN_EMAILS];

// Thêm admin email mới (cho admin management system sau này)
export const addAdminEmail = (email) => {
  if (!email || ADMIN_EMAILS.includes(email.toLowerCase())) return false;
  ADMIN_EMAILS.push(email.toLowerCase());
  return true;
};

// Xóa admin email (cho admin management system sau này)
export const removeAdminEmail = (email) => {
  if (!email) return false;
  const index = ADMIN_EMAILS.indexOf(email.toLowerCase());
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    return true;
  }
  return false;
};
