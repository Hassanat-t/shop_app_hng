# Payments — Paystack (Test Mode)

## Flow

```
CHECKOUT → "PAY ₦X WITH PAYSTACK"
  → POST /api/orders { step: "init", ... }    # server prices from DB
  → priced order + line items saved in pending_payments (unique reference)
  → Paystack transaction initialized (amount in kobo)
  → browser redirects to Paystack checkout page
  → customer pays (test card)
  → TWO paths complete the order, whichever arrives first:
      a) Paystack redirects to /checkout/verify?reference=...
         → POST /api/orders { payment_reference }
      b) Paystack calls POST /api/paystack/webhook (charge.success)
  → both call completePaystackPayment() (src/lib/orders.ts):
      verify with Paystack (status + exact amount) → place_order()
  → order + items created in ONE transaction, exactly once
  → ORDER SUCCESS (email sent only when the order is first created)
```

Key files: `src/lib/orders.ts`, `src/lib/paystack.ts`,
`src/app/api/orders/route.ts`, `src/app/api/paystack/webhook/route.ts`,
`src/app/checkout/verify/page.tsx`, `supabase/payments-hardening.sql`.

## Security

- Totals are computed **server-side** from DB prices; the browser amount
  is never trusted. What was priced is stored in `pending_payments`
  before payment, and the order is built from that row, not from the browser.
- Before creating an order, the server calls Paystack's `verify` endpoint
  and rejects it if status ≠ success or amount ≠ the stored total.
- The verify step checks that the payment belongs to the signed-in user.
- `PAYSTACK_SECRET_KEY` is server-only. The public key
  (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) is safe in the browser.

## Exactly-once orders

| Risk | Protection |
| --- | --- |
| Verify page refreshed, request retried, or webhook + verify both arrive | `place_order()` locks the `pending_payments` row and returns the existing order for that reference (`created: false`). A unique index on `orders.payment_reference` is the final backstop. |
| Order saved but its items fail | `place_order()` inserts the order and its items in one database transaction: both or neither. |
| Customer closes the tab after paying | The Paystack webhook creates the order without the browser. |
| Fake webhook calls | Requests must carry a valid `x-paystack-signature` (HMAC-SHA512 of the raw body with the secret key, compared in constant time). |
| Duplicate confirmation emails | The email is sent only when the order is first created. |

## Setup

1. [paystack.com](https://paystack.com) → sign up → toggle **Test Mode**.
2. Settings → API Keys → copy **Test Secret** (`sk_test_...`) and
   **Test Public** (`pk_test_...`) keys into `.env.local`:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
   ```
3. Run `supabase/paystack.sql`, then `supabase/payments-hardening.sql`,
   in the Supabase SQL Editor (`pending_payments`, payment columns,
   the unique payment reference and the `place_order()` function).
4. Add the webhook: Paystack Dashboard → Settings → API Keys & Webhooks →
   Test Webhook URL = `https://<your-site>/api/paystack/webhook`.
   (Webhooks can't reach `localhost`; use your Vercel preview URL, or a
   tunnel such as ngrok, to test it locally.)
5. Restart the dev server.

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
