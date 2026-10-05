-- Shared server-side cart for website + mobile (Lesson 3).
-- One row per (user, product, options signature). Products referenced by id.
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity >= 1 and quantity <= 50),
  options jsonb not null default '[]'::jsonb,
  options_sig text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id, options_sig)
);

create index if not exists idx_cart_items_user on cart_items(user_id);
create index if not exists idx_cart_items_product on cart_items(product_id);

alter table cart_items enable row level security;

drop policy if exists "users manage own cart" on cart_items;
create policy "users manage own cart" on cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mobile checkout inserts directly with the anon key (website uses the
-- service-role key server-side, phones must never hold it), so allow users
-- to insert their OWN orders + items. Reads stay owner-only per schema.sql.
drop policy if exists "users insert own orders" on orders;
create policy "users insert own orders" on orders
  for insert with check (auth.uid() = user_id);
drop policy if exists "users insert own items" on order_items;
create policy "users insert own items" on order_items
  for insert with check (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));

