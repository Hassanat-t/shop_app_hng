# Database Reference

SQL files: [`supabase/schema.sql`](../supabase/schema.sql),
[`supabase/seed.sql`](../supabase/seed.sql),
[`supabase/paystack.sql`](../supabase/paystack.sql).

## Tables

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` (FK, cascade delete) |
| `full_name` / `email` / `avatar_url` | text | From OAuth profile |
| `created_at` / `updated_at` | timestamptz | Defaults `now()` |

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `name` / `slug` | text | `slug` unique (e.g. `taro-boba`), used for URLs + cart merge keys |
| `description` | text | Shown on cards + details pages |
| `category` | text | `'cookies'` or `'boba'` (CHECK constraint) |
| `price` | integer | **NGN naira** (not kobo). Server is the source of truth. |
| `image_url` | text | e.g. `/products/taro-boba.svg` |
| `is_active` | boolean | Only `true` rows are publicly readable/sold |
| `created_at` / `updated_at` | timestamptz | Menu ordering |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `profiles.id` | Owner; RLS restricts reads to owner |
| `order_number` | text unique | Human-friendly, e.g. `TPO-20261002-4821` |
| `customer_name` / `email` / `phone` | text | From checkout form |
| `fulfilment_method` | text | `'pickup'` or `'delivery'` |
| `delivery_address` / `notes` | text | Address required when delivery |
| `subtotal` / `delivery_fee` / `total` | integer | **Computed server-side** from DB prices |
| `status` | text | `'pending'` (no payment) or `'paid'` (Paystack) |
| `payment_reference` / `payment_status` | text | Paystack ref (see `paystack.sql`) |
| `created_at` / `updated_at` | timestamptz | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_id` | uuid FK → `orders.id` | Cascade delete |
| `product_id` | uuid FK → `products.id` | |
| `product_name` | text | Snapshot incl. options, e.g. `Taro Boba (Large)` |
| `unit_price` / `quantity` / `line_total` | integer | Server-computed |

### `pending_payments`
Tracks Paystack initializations so `/checkout/verify` can reconcile.
Service-role only (no public RLS policies). Created by
[`supabase/paystack.sql`](../supabase/paystack.sql).

## Row Level Security

- `products`: anyone can `SELECT` where `is_active = true`.
- `orders`: users can `SELECT` only their own (`auth.uid() = user_id`).
  Writes go through the **service role** in `/api/orders` (never the browser).
- `order_items`: readable only via an order the user owns.
- `profiles`: users read their own row.

## Seed data

`seed.sql` inserts the 8 launch products with placeholder NGN prices —
**update them to real prices** before launch:

| Product | Slug | Seed price |
|---|---|---|
| Chocolate Chip Thin | `chocolate-chip-thin` | ₦2,500 |
| Biscoff Thin | `biscoff-thin` | ₦2,800 |
| White Chocolate Thin | `white-chocolate-thin` | ₦2,800 |
| Oreo Thin | `oreo-thin` | ₦2,800 |
| Taro Boba | `taro-boba` | ₦3,500 |
| Milk Tea Boba | `milk-tea-boba` | ₦3,200 |
| Oreo Boba | `oreo-boba` | ₦3,800 |
| Lychee Boba | `lychee-boba` | ₦3,400 |
