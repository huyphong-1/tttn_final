# 🔐 Hướng dẫn tạo Admin User

## Phương pháp 1: Sử dụng Supabase Dashboard (Khuyến nghị)

### Bước 1: Tạo User trong Auth
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Authentication** > **Users**
4. Click **Add user**
5. Nhập thông tin:
   - **Email**: `admin@techphone.com`
   - **Password**: `admin123456` (đổi sau khi đăng nhập)
   - **Auto Confirm User**: ✅ Bật
6. Click **Create user**

### Bước 2: Cập nhật Role thành Admin
1. Vào **SQL Editor** trong Supabase Dashboard
2. Chạy query sau (thay UUID mẫu bằng UUID thực tế từ bước 1):

```sql
-- Tìm UUID của user vừa tạo
SELECT id, email FROM auth.users WHERE email = 'admin@techphone.com';

-- Lưu ý: Bạn cần tạo user trong Auth trước, sau đó chạy INSERT này với đúng UUID

-- Ví dụ: Nếu bạn đã tạo user admin@techphone.com trong Auth UI
-- và có UUID là 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- thì uncomment và chỉnh sửa dòng dưới:

/*
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    phone, 
    address, 
    city,
    created_at,
    updated_at
) VALUES (
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Thay bằng UUID thực tế
    'admin@techphone.com',
    'Administrator',
    'admin',
    '0123456789',
    '123 Admin Street',
    'Hà Nội',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Administrator',
    updated_at = NOW();
*/
```

## Phương pháp 2: Sử dụng Script Node.js

### Bước 1: Cài đặt dependencies
```bash
npm install dotenv
```

### Bước 2: Cập nhật .env
Thêm vào file `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Lấy Service Role Key:**
1. Vào Supabase Dashboard > Settings > API
2. Copy **service_role** key (không phải anon key)

### Bước 3: Chạy script
```bash
node scripts/createAdmin.js
```

## Phương pháp 3: Tạo thủ công qua ứng dụng

### Bước 1: Đăng ký tài khoản bình thường
1. Mở ứng dụng
2. Đăng ký với email: `admin@techphone.com`
3. Xác nhận email nếu cần

### Bước 2: Cập nhật role trong database
Vào Supabase Dashboard > SQL Editor và chạy:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@techphone.com';
```

## ✅ Xác nhận Admin User hoạt động

Sau khi tạo admin user, hãy kiểm tra:

1. **Đăng nhập** với `admin@techphone.com`
2. **Kiểm tra Navbar** - phải có button "Admin" màu tím
3. **Truy cập** `/admin` - phải thấy Admin Dashboard
4. **Kiểm tra quyền**:
   - `/admin/products` - Quản lý sản phẩm
   - `/admin/users` - Quản lý người dùng
   - Tất cả tính năng admin khác

## 🔒 Bảo mật

### Sau khi tạo admin:
1. **Đổi password** ngay lập tức
2. **Cập nhật thông tin** cá nhân
3. **Xóa script** `createAdmin.js` nếu không cần
4. **Không commit** service role key vào git

### Thông tin đăng nhập mặc định:
- **Email**: `admin@techphone.com`
- **Password**: `admin123456`
- **Role**: `admin`

⚠️ **LƯU Ý**: Đổi password ngay sau lần đăng nhập đầu tiên!

## 🛠️ Troubleshooting

### Lỗi "User already exists"
- User đã tồn tại, chỉ cần cập nhật role thành admin

### Lỗi "Insufficient permissions"
- Kiểm tra Service Role Key
- Đảm bảo RLS policies đã được setup

### Không thấy button Admin
- Kiểm tra role trong database: `SELECT * FROM profiles WHERE email = 'admin@techphone.com'`
- Đảm bảo role = 'admin'

### Không truy cập được admin pages
- Clear browser cache
- Đăng xuất và đăng nhập lại
- Kiểm tra console errors
