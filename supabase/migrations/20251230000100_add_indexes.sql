create index if not exists idx_profiles_role on profiles (role);
create index if not exists idx_profiles_email on profiles (email);

create index if not exists idx_orders_user_id on orders (user_id);
create index if not exists idx_orders_created_at on orders (created_at);
create index if not exists idx_orders_status on orders (status);

create index if not exists idx_products_category on products (category);
create index if not exists idx_products_brand on products (brand);
create index if not exists idx_products_created_at on products (created_at);
