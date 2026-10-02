# Changelog

All notable changes to tt's pink oven.

## Unreleased

- Paystack test-mode payments (init → redirect → server-side verify).
- `pending_payments` table + payment columns (`supabase/paystack.sql`).
- Cart merges by slug + options (no duplicate rows).
- Product cards show live `− qty +` stepper.
- Dynamic rendering (`force-dynamic`) on menu, product, orders, success pages.
- Pending-order insert made non-fatal; verify page waits for cart hydration.
- Scrubbed committed secrets from `.env.example`.

## 0.1.0 — Initial build

- Next.js 16 + TypeScript + Tailwind shop shell with brand system
  (`--wine`, `--pink`, `--light-pink`, `--cream`).
- Home, menu, product details, cart (localStorage), checkout pages.
- Supabase schema + seed (profiles, products, orders, order_items) with RLS.
- Google OAuth via Supabase Auth (`/login`, `/auth/callback`).
- Server-priced order API with Mailgun confirmation emails.
- Order success + my-orders pages.
