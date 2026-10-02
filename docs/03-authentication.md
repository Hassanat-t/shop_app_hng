# Authentication (Supabase Auth + Google OAuth)

## How it works

- Supabase SSR helpers: `src/lib/supabase/client.ts` (browser) and
  `src/lib/supabase/server.ts` (server, cookie-based).
- Login page: `src/app/login/page.tsx` — "Continue with Google" calls
  `signInWithOAuth({ provider: "google" })`.
- Callback: `src/app/auth/callback/route.ts` exchanges the `code` for a
  session and redirects home (or to `?next=`).
- Protected pages (`/account/orders`) call `auth.getUser()` server-side
  and `redirect("/login")` when signed out.
- Checkout requires a session; `/api/orders` returns 401 otherwise.

## Google Cloud setup

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs &
   Services → Credentials → **Create Credentials → OAuth client ID**
   (type: Web application).
2. **Authorized JavaScript origins** (origins only — NO path):
   - `http://localhost:3000`
   - `https://YOUR-SITE.vercel.app` (production)
3. **Authorized redirect URIs** (full path required):
   - `https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback`
4. Copy the Client ID + Client Secret.

> Common mistake: putting `.../auth/v1/callback` in *JavaScript origins*
> gives "Invalid Origin: URIs must not contain a path". The callback path
> belongs in *redirect URIs* only.

## Supabase setup

1. Dashboard → Authentication → Providers → **Google** → Enable →
   paste Client ID + Secret.
2. Authentication → URL Configuration → Redirect URLs, add:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-SITE.vercel.app/auth/callback`

## Testing

1. Log out, visit `/account/orders` → should redirect to `/login`.
2. "Continue with Google" → consent → lands back on the site, signed in.
3. Header "Account" → orders page shows your history.
