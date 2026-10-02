# Contributing

## Rules (from the project brief)

- Inspect before changing; don't delete/overwrite working features.
- Keep code clean, modular, typed, beginner-readable.
- Server/client separation: secrets and DB writes stay server-side
  (route handlers + `src/lib`), never in `"use client"` components.
- Prices: the server (`src/app/api/orders/route.ts`) is the only source of
  truth — never trust browser totals.
- Validate each feature before moving on; keep `npm run lint` and
  `npm run build` green.

## Workflow

1. Create a branch from `main`.
2. Make small, focused commits.
3. Add/extend docs in `docs/` when behavior changes.
4. Test with [docs/08-testing.md](./docs/08-testing.md).
5. Open a PR describing what changed and how it was verified.

## Secrets

Never commit `.env.local` or any key. If a secret is ever committed,
rotate it immediately (Supabase, Paystack, Google, Mailgun).
