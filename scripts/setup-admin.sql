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
-- Remove existing policies to avoid conflicts/duplicates
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END $$;

-- Policy cho user chỉ có thể xem/sửa profile của mình
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy cho admin có thể xem/sửa tất cả profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert all profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_admin());

-- 2b. Orders RLS policies (order history visibility)
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2c. Dashboard metrics table + policies
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
    id TEXT PRIMARY KEY,
    total_users NUMERIC DEFAULT 0,
    total_orders NUMERIC DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read dashboard metrics" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "Admins can upsert dashboard metrics" ON public.dashboard_metrics;
DROP POLICY IF EXISTS "Admins can update dashboard metrics" ON public.dashboard_metrics;

CREATE POLICY "Admins can read dashboard metrics" ON public.dashboard_metrics
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can upsert dashboard metrics" ON public.dashboard_metrics
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update dashboard metrics" ON public.dashboard_metrics
    FOR UPDATE USING (public.is_admin());

-- 3. Tạo function để tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$;

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
    'a9b83f82-ed0a-4ed4-8244-06083c13c48c',
    'admin@techphone.com',
    'Administrator',
    'admin',
    '0348222356',
    'ABCt',
    'Hà Nội',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Administrator',
    updated_at = NOW();


-- 6. Cấp quyền cho authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

