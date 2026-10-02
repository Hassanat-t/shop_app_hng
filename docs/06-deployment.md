# Deployment — GitHub + Vercel

## 1. Push to GitHub

The app lives in `Stage_2/tt-pink-oven`. Either push the whole folder:

```powershell
cd C:\Users\hassa\OneDrive\Desktop\HNG\Stage_2
git init
git add tt-pink-oven
git commit -m "tt's pink oven e-commerce site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

…or make the repo root the app itself (cleaner for Vercel —
no Root Directory setting needed):

```powershell
cd C:\Users\hassa\OneDrive\Desktop\HNG\Stage_2\tt-pink-oven
git init
git add .
git commit -m "tt's pink oven e-commerce site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

**Before pushing:** run `git status` and confirm `.env.local` is NOT
listed (`.gitignore` covers `.env*`). Never commit secrets — rotate any
key that was ever committed.

## 2. Deploy on Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub → Add New →
   Project → select the repo.
2. If the repo root is `Stage_2`, set **Root Directory** to `tt-pink-oven`.
3. Framework preset: Next.js (auto-detected). Build: `npm run build`.
4. Add **Environment Variables** (same values as `.env.local`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`,
   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, and
   `NEXT_PUBLIC_SITE_URL=https://YOUR-SITE.vercel.app`.
5. Deploy.

## 3. Post-deploy URL updates (login/payments break without these)

1. **Supabase** → Authentication → URL Configuration → add:
   - `https://YOUR-SITE.vercel.app/auth/callback`
   - `https://YOUR-SITE.vercel.app/checkout/verify`
2. **Google Cloud** → OAuth client → Authorized JavaScript origins → add
   `https://YOUR-SITE.vercel.app`. (Redirect URI stays the Supabase
   `.../auth/v1/callback` URL.)
3. Confirm `NEXT_PUBLIC_SITE_URL` on Vercel is the live URL (used for the
   Paystack callback).

Then test the live site end-to-end (see [08-testing.md](./08-testing.md)).
