# Email — Mailgun (Optional)

Order confirmation emails are sent server-side by `src/lib/email.ts`
(`sendOrderEmail` + `orderEmailHtml`). **The shop works fine without
Mailgun** — if the keys are missing, the order still saves and the server
logs `Mailgun not configured, skipping email`.

## Sandbox (testing)

1. Sign up at [mailgun.com](https://www.mailgun.com) → Sending → Domains
   → copy your sandbox domain (e.g. `sandboxXXX.mailgun.org`).
2. Add your own email under **Authorized Recipients** and click the
   confirmation link (sandbox can only send to authorized addresses).
3. Profile → API Keys → copy the **Private** key (`key-...`).
4. `.env.local`:
   ```env
   MAILGUN_API_KEY=key-...
   MAILGUN_DOMAIN=sandboxXXX.mailgun.org
   MAILGUN_FROM_EMAIL=tt's pink oven <postmaster@sandboxXXX.mailgun.org>
   ```
5. Place a test order with the authorized email → subject:
   *"Your tt's pink oven order is confirmed 💗"*.

## Production

1. Sending → Domains → Add domain (e.g. `mg.ttpinkoven.shop`) → add the
   SPF/DKIM/MX/CNAME records at your registrar → wait for Verified.
2. Update `.env.local` to the custom domain + address.

## Notes

- Keys stay server-side; failures are logged, never shown to customers.
- Skipping Mailgun? Consider rewording the "confirmation email has been
  sent" line on the order-success page.
