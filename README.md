# 📱 TechPhone E-commerce Store

Ứng dụng thương mại điện tử bán điện thoại và phụ kiện được xây dựng với React, Vite, Supabase và TailwindCSS.

## ✨ Tính năng chính

- 🛒 **Giỏ hàng thông minh**: Thêm, xóa, cập nhật số lượng sản phẩm
- 🔐 **Xác thực người dùng**: Đăng ký, đăng nhập với Supabase Auth
- 👤 **Phân quyền**: Admin và user với các quyền khác nhau
- 📱 **Responsive Design**: Tối ưu cho mọi thiết bị
- 🌙 **Dark/Light Mode**: Chế độ sáng/tối
- 🔍 **Tìm kiếm sản phẩm**: Tìm kiếm thông minh với gợi ý
- 📦 **Quản lý đơn hàng**: Theo dõi lịch sử và trạng thái đơn hàng
- 💳 **Thanh toán**: Tích hợp checkout process

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Supabase (Database + Auth + API)
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Icons**: React Icons
- **Styling**: TailwindCSS với custom theme

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd troll
```

### Bước 2: Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### Bước 3: Cấu hình environment variables
```bash
# Copy file .env.example thành .env
cp .env.example .env

# Cập nhật các giá trị trong .env với thông tin Supabase của bạn
```

### Bước 4: Chạy development server
```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📁 Cấu trúc dự án

```
src/
├── components/          # Các component tái sử dụng
│   ├── Navbar.jsx      # Navigation bar
│   ├── Footer.jsx      # Footer
│   ├── DarkMode.jsx    # Toggle dark/light mode
│   └── ...
├── pages/              # Các trang chính
│   ├── HomePage.jsx    # Trang chủ
│   ├── LoginPage.jsx   # Trang đăng nhập
│   ├── CartPage.jsx    # Trang giỏ hàng
│   └── ...
├── context/            # React Context
│   ├── AuthContext.jsx # Quản lý authentication
│   └── CartContext.jsx # Quản lý giỏ hàng
├── Route/              # Protected routes
├── lib/                # Utilities và services
│   └── supabase.js     # Supabase client
└── assets/             # Static assets
```

## 🗄️ Database Schema

### Bảng chính trong Supabase:
- `profiles`: Thông tin người dùng
- `orders`: Đơn hàng
- `order_status`: Trạng thái đơn hàng
- `order_tracking`: Theo dõi đơn hàng

## 🔧 Scripts có sẵn

```bash
npm run dev          # Chạy development server
npm run build        # Build cho production
npm run preview      # Preview production build
npm run lint         # Chạy ESLint
```

## 🌐 Deployment

### Vercel (Khuyến nghị)
```bash
npm run build
# Deploy folder dist/ lên Vercel
```

### Netlify
```bash
npm run build
# Deploy folder dist/ lên Netlify
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Email: support@techphone.com
- Website: https://techphone.com
