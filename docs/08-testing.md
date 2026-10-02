# Manual Testing Checklist

Run through this after setup and after every big change.
Target: `npm run lint` and `npm run build` pass clean.

## Shop flow

- [ ] `/` — hero, best sellers, story, CTA, footer render; mobile stacks.
- [ ] `/menu` — 8 products load; ALL / COOKIES / BOBA filters work.
- [ ] `/menu/[slug]` — image, description, price, qty stepper; boba shows
      Regular/Large (+₦500); related products show.
- [ ] Product card `+` → becomes `− 1 +`; counts update live; `−` to 0
      collapses back to `+`. Same product from home + menu merges to one row.
- [ ] `/cart` — qty +/−, remove, subtotal correct; refresh persists cart;
      empty state shows with "Continue shopping".

## Auth + checkout

- [ ] `/checkout` signed out → redirects to `/login`.
- [ ] `/login` → Continue with Google → returns signed in.
- [ ] Checkout validation: missing name/email/phone blocked; delivery
      without address blocked.
- [ ] Paystack on: button reads `PAY ₦X WITH PAYSTACK` → redirects to
      Paystack → test card `4084 0840 8408 4081` (PIN `0000`) → verify page
      → order success with `TPO-...` number.
- [ ] Paystack off (keys unset): button reads `PLACE ORDER` → order
      created directly with status `pending`.
- [ ] `/order-success/[orderNumber]` — items, subtotal, delivery, total,
      fulfilment, email shown.
- [ ] `/account/orders` — order listed; signed out → redirect to login.

## Dynamic check

- [ ] Change a price in Supabase `products` → refresh `/menu` → new price
      shows with no rebuild.

## Edge cases

- [ ] Inactive product (`is_active = false`) hidden from menu; direct API
      order with its slug rejected.
- [ ] Tampered client price (e.g. edit localStorage) → server total still
      correct; Paystack amount check rejects mismatch.
- [ ] Failed payment → `402` message, no order created.
- [ ] Mailgun unset → order succeeds, server logs skip message.
