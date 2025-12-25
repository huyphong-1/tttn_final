-- SQL script để tạo admin user trực tiếp trong Supabase
-- Chạy script này trong Supabase SQL Editor

-- 1. Tạo bảng profiles nếu chưa có
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    phone TEXT,
    address TEXT,
    city TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo RLS policies cho bảng profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy cho user chỉ có thể xem/sửa profile của mình
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy cho admin có thể xem/sửa tất cả profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Tạo function để tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tạo trigger để tự động tạo profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Tạo admin user (thay đổi email và thông tin theo ý muốn)
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

-- 6. Cấp quyền cho authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
