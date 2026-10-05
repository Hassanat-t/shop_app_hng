-- tt's pink oven schema
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, email text, avatar_url text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists products (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text default '', category text not null check (category in ('cookies','boba')), price integer not null check (price >= 0), image_url text not null, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists orders (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), order_number text unique not null, customer_name text not null, email text not null, phone text not null, fulfilment_method text not null check (fulfilment_method in ('pickup','delivery')), delivery_address text default '', notes text default '', subtotal integer not null, delivery_fee integer not null, total integer not null, status text default 'pending', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists order_items (id uuid primary key default gen_random_uuid(), order_id uuid references orders(id) on delete cascade, product_id uuid references products(id), product_name text not null, unit_price integer not null, quantity integer not null, line_total integer not null, created_at timestamptz default now());
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_items_order on order_items(order_id);
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table profiles enable row level security;
drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (is_active = true);
drop policy if exists "users read own orders" on orders;
create policy "users read own orders" on orders for select using (auth.uid() = user_id);
drop policy if exists "users read own items" on order_items;
create policy "users read own items" on order_items for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles for select using (auth.uid() = id);
-- Signup upserts the caller's own profile row (id = auth.uid()).
drop policy if exists "users insert own profile" on profiles;
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on profiles;
create policy "users update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
