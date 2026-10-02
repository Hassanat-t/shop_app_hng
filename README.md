# tt's pink oven — Thin Cookies & Boba

Full-stack Next.js 16 + TypeScript + Tailwind CSS shop with Supabase
(PostgreSQL + Auth), Paystack test-mode payments, and Mailgun order emails.

> Full guides live in [`docs/`](./docs): setup, deployment,
> architecture, database, payments, auth, email, testing, and troubleshooting.

## Quick start

```bash
cd tt-pink-oven
npm install
cp .env.example .env.local   # fill in values (see docs/01-setup.md)
npm run dev                  # http://localhost:3000
```

## Docs

| File | Contents |
|---|---|
| [docs/01-setup.md](./docs/01-setup.md) | Local setup, env vars, install |
| [docs/02-database.md](./docs/02-database.md) | Schema, RLS, seed data |
| [docs/03-authentication.md](./docs/03-authentication.md) | Supabase Auth + Google OAuth |
| [docs/04-payments-paystack.md](./docs/04-payments-paystack.md) | Paystack test-mode flow + test cards |
| [docs/05-email-mailgun.md](./docs/05-email-mailgun.md) | Mailgun setup (optional) |
| [docs/06-deployment.md](./docs/06-deployment.md) | GitHub + Vercel hosting |
| [docs/07-architecture.md](./docs/07-architecture.md) | Project structure, data flow |
| [docs/08-testing.md](./docs/08-testing.md) | Manual test checklist (full order flow) |
| [docs/09-troubleshooting.md](./docs/09-troubleshooting.md) | Common errors + fixes |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (must pass clean) |
| `npm run lint` | ESLint check (must pass clean) |
| `npm start` | Serve production build |

## Project layout

```
src/
  app/            # Routes: /, /menu, /menu/[slug], /cart, /checkout,
                  # /checkout/verify, /login, /auth/callback,
                  # /order-success/[orderNumber], /account/orders
  components/     # Header, Footer, ProductCard, CartProvider
  data/           # Fallback product catalogue (used when Supabase unset)
  lib/            # Supabase clients, products, paystack, email helpers
  types/          # Shared TypeScript types
supabase/         # schema.sql, seed.sql, paystack.sql
public/products/ # Placeholder product art (SVG — swap for real photos)
docs/             # Full documentation
```

## Brand

| Token | Value | Use |
|---|---|---|
| `--wine` | `#670625` | Buttons, headings, nav accents |
| `--pink` | `#E8B7C2` | Badges, hovers, decoration |
| `--light-pink` | `#FFF5F7` | Page background |
| `--cream` | `#F7F1EA` | Card backgrounds |

Fonts: Playfair Display (headings) + Nunito Sans (body).

## Security notes

- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`,
  `MAILGUN_API_KEY`, `GOOGLE_CLIENT_SECRET`) are server-side only —
  never import them in `"use client"` files.
- Order totals are computed server-side from DB prices in
  `src/app/api/orders/route.ts`; Paystack payments are verified
  server-side before an order is created.
- Never commit `.env.local`. Rotate any key that was ever committed.

## License

Private project — all rights reserved.
