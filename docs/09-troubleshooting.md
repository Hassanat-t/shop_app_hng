# Troubleshooting

## `npm install` times out
Registry is slow — retry. Verify with `npm ping`. Install in two steps:
`npm install`, then `npm install @supabase/ssr @supabase/supabase-js zod`.

## `next` / `eslint` not recognized
`node_modules` missing — install step didn't finish. Re-run `npm install`.

## Menu shows fallback prices / products missing
- `.env.local` missing or dev server not restarted after editing it.
- Supabase `products` table empty → run `supabase/seed.sql`.
- Check terminal for Supabase errors; `getProducts()` falls back silently.

## "Could not start payment" on checkout
- `PAYSTACK_SECRET_KEY` missing/wrong (must be `sk_test_...`, server-only).
- Look at the terminal: `Paystack init failed ...` has the real reason.
- `pending_payments` insert failure is non-fatal (run
  `supabase/paystack.sql` to silence it).

## Button says "PLACE ORDER" instead of "PAY ... WITH PAYSTACK"
`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` isn't reaching the browser — add it to
`.env.local` (and Vercel env) and restart/redeploy.

## `/checkout/verify` says "session expired"
Old bug (fixed): the page verified before the cart hydrated. Pull latest.
If it persists, the `tpo-pending-order` localStorage entry is gone —
rebuild the cart and retry; the reference is shown on screen for Paystack
dashboard lookup.

## "Payment amount mismatch"
Cart changed between init and verify, or prices changed in Supabase
mid-checkout. Rebuild the cart and pay again.

## Google login: "Invalid Origin: must not contain a path"
`.../auth/v1/callback` was put in **JavaScript origins** — it belongs in
**redirect URIs** only. See [03-authentication.md](./03-authentication.md).

## Login loops / 401 on `/api/orders`
- Supabase redirect URLs missing `.../auth/callback` (local + production).
- `NEXT_PUBLIC_SITE_URL` on Vercel still `localhost` — set to live URL.

## Duplicate cart rows
Fixed via slug-based merge keys. Refresh once — `mergeItems` consolidates
old `localStorage` entries on load.

## Build errors about Supabase packages
Supabase clients use lazy `require` with a graceful fallback so builds
pass pre-install — but runtime needs the real packages. Run the install
step above.
