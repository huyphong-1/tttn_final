-- Profiles table, RLS policies, and profile bootstrap trigger.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('admin', 'user', 'guest')),
  status text default 'active' check (status in ('active', 'inactive')),
  phone text,
  address text,
  city text,
  avatar_url text,
  date_of_birth date,
  gender text,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists last_login timestamptz;
alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column status set default 'active';

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can insert all profiles" on public.profiles;
drop policy if exists "Admins can delete all profiles" on public.profiles;

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Admins can update all profiles" on public.profiles
  for update using (public.is_admin());

create policy "Admins can insert all profiles" on public.profiles
  for insert with check (public.is_admin());

create policy "Admins can delete all profiles" on public.profiles
  for delete using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'user', 'active');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, insert, update, delete on public.profiles to authenticated;
grant usage on schema public to authenticated;
