# Architecture

## Rendering

- Next.js App Router. Product/order pages are **dynamic**
  (`export const dynamic = "force-dynamic"`) — always fresh from Supabase,
  never stale static builds.
- `src/data/products.ts` is a fallback catalogue used only when Supabase
  env vars are missing (or the query returns nothing).

## Request flow (paid order)

```
Checkout form (client, src/app/checkout/page.tsx)
  │ POST /api/orders { step: "init", items: [{slug, qty, options}] }
  ▼
Route handler (server, src/app/api/orders/route.ts)
  │ 1. validate() input          4. POST Paystack /transaction/initialize
  │ 2. auth.getUser() (401 if out)  (amount = server total × 100 kobo)
  │ 3. loadCatalogue() + buildLines() → subtotal/delivery/total
  ▼
Paystack checkout → /checkout/verify?reference=...
  │ POST /api/orders { payment_reference, ... } → paystackVerify()
  │ amount + status must match → insert orders + order_items (service role)
  │ → sendOrderEmail() (best-effort)
  ▼
/order-success/[orderNumber] → /account/orders
```

## State

- Cart: `CartProvider` (React context) + `localStorage` (`tpo-cart-v1`).
  Lines merge by **slug + options** so Supabase/fallback ID differences
  never create duplicates (`mergeItems` on add + on load).
- Pending checkout snapshot: `tpo-pending-order` in localStorage, consumed
  by the verify page; server also caches to `pending_payments` (best-effort).

## Key modules

| Path | Role |
|---|---|
| `src/app/*` | Routes + API (`/api/orders`) |
| `src/components/layout/*` | Header (nav, cart badge, mobile menu), Footer |
| `src/components/products/ProductCard.tsx` | Card with `− qty +` stepper |
| `src/components/cart/CartProvider.tsx` | Cart state, persistence, merge logic |
| `src/lib/supabase/*` | SSR browser + server clients (lazy `require` with graceful fallback) |
| `src/lib/products.ts` | `getProducts()` / `getProductBySlug()` (DB → fallback) |
| `src/lib/paystack.ts` | Init + verify helpers (server only) |
| `src/lib/email.ts` | Mailgun sender + branded HTML template |
| `src/types/index.ts` | `Product`, `CartItem`, `CheckoutForm`, … |
