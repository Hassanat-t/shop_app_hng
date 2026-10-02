# Setup Guide

## Prerequisites

- Node.js 20+ (`node --version`)
- A free [Supabase](https://supabase.com) account
- A free [Paystack](https://paystack.com) account (test mode)
- A [Google Cloud](https://console.cloud.google.com) project (for login)
- Optional: a [Mailgun](https://www.mailgun.com) account (for emails)

## 1. Install

```bash
cd tt-pink-oven
npm install
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` (see table below). **Never commit this file.**

| Variable | Where to get it | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Yes (safe) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → anon/public key | Yes (safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **No — server only** |
| `PAYSTACK_SECRET_KEY` | Paystack (test mode) → Settings → API Keys → Secret | **No — server only** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack (test mode) → Public key | Yes (safe) |
| `MAILGUN_API_KEY` | Mailgun → API Keys → Private key (optional) | **No — server only** |
| `MAILGUN_DOMAIN` | Mailgun → Sending → Domains (optional) | Server only |
| `MAILGUN_FROM_EMAIL` | e.g. `tt's pink oven <hello@yourdomain>` (optional) | Server only |
| `GOOGLE_CLIENT_ID` | Google Cloud → Credentials → OAuth client | Used via Supabase |
| `GOOGLE_CLIENT_SECRET` | Google Cloud → Credentials | **No — via Supabase** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally | Yes (safe) |

After editing env vars, **restart** the dev server.

## 3. Database

In Supabase → SQL Editor, run in order:

1. `supabase/schema.sql` — tables (`profiles`, `products`, `orders`,
   `order_items`) + indexes + Row Level Security policies.
2. `supabase/seed.sql` — the 8 starter products (NGN placeholder prices).
3. `supabase/paystack.sql` — `pending_payments` table + payment columns
   on `orders`.

See [02-database.md](./02-database.md) for the full schema reference.

## 4. Auth (Google)

Follow [03-authentication.md](./03-authentication.md): create the Google
OAuth client, enable Google in Supabase Auth, add redirect URLs.

## 5. Run

```bash
npm run dev     # http://localhost:3000
npm run lint    # must pass clean
npm run build   # must pass clean
```
