# Payments — Paystack (Test Mode)

## Flow

```
CHECKOUT → "PAY ₦X WITH PAYSTACK"
  → POST /api/orders { step: "init", ... }   # server prices from DB
  → Paystack transaction initialized (amount in kobo)
  → browser redirects to Paystack checkout page
  → customer pays (test card) → Paystack redirects to
    /checkout/verify?reference=...           # server verifies amount
  → order created in Supabase (status: "paid")
  → ORDER SUCCESS
```

Key files: `src/lib/paystack.ts`, `src/app/api/orders/route.ts`,
`src/app/checkout/page.tsx`, `src/app/checkout/verify/page.tsx`.

## Security

- Totals are computed **server-side** from DB prices; the browser amount
  is never trusted.
- After payment, the server calls Paystack's `verify` endpoint and
  rejects the order if status ≠ success or amount ≠ expected total.
- `PAYSTACK_SECRET_KEY` is server-only. The public key
  (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) is safe in the browser.

## Setup

1. [paystack.com](https://paystack.com) → sign up → toggle **Test Mode**.
2. Settings → API Keys → copy **Test Secret** (`sk_test_...`) and
   **Test Public** (`pk_test_...`) keys into `.env.local`:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
   ```
3. Run `supabase/paystack.sql` in the Supabase SQL Editor
   (`pending_payments` table + payment columns on `orders`).
4. Restart the dev server.

Without keys, checkout falls back to direct "PLACE ORDER" (pay on
pickup/delivery) — nothing crashes.

## Test cards (Paystack test mode)

| Card | Number | Notes |
|---|---|---|
| Verve / Mastercard success | `4084 0840 8408 4081` | Any future expiry, any CVV, PIN `0000` |
| Visa success | `4111 1111 1111 1111` | Any future expiry, any CVV |

See [Paystack test docs](https://paystack.com/docs/payments/test-payments/)
for more cards (declined, insufficient funds, etc.).

## Going live

1. Complete Paystack business compliance → toggle **Live Mode**.
2. Replace env vars with live keys (`sk_live_...`, `pk_live_...`).
3. Update `NEXT_PUBLIC_SITE_URL` to the production URL.
No code changes needed.
