# Running the Website and Mobile App

## 0. One-time Supabase setup (required for shared cart + mobile checkout)

In the Supabase dashboard → SQL editor, run `supabase/cart.sql` once, then
enable Realtime for the `cart_items` table (Database → Replication).
Without this, login works but carts cannot sync.

## 1. Website (Next.js)

```bash
cd tt-pink-oven
npm install
npm run dev   # http://localhost:3000
```

Login (`/login`) offers Google (as before) **and** email/password — the email
login uses the SAME Supabase Auth project as the mobile app, so use one email
account on both clients for the sync test.

## 2. Mobile app (Flutter, `mobile/`)

```bash
cd mobile
dart pub get            # (or: flutter pub get)
flutter devices        # connect phone via USB with USB debugging on
flutter run            # or: flutter run -d <device-id> for the phone
```

On **Windows**, prefer the helper script — it works around the OneDrive file
locks described in section 4:

```powershell
cd mobile\tool
.\dev.ps1                # stop Gradle daemons, then flutter run
.\dev.ps1 -Build         # build the debug APK instead of deploying
.\dev.ps1 -Clean         # full flutter clean first (slow)
.\dev.ps1 -Clean -Build  # full reset, then build
```

Any extra arguments are forwarded to Flutter, e.g.
`.\dev.ps1 --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com`.

The app talks DIRECTLY to Supabase (same URL + anon key as the website —
no localhost, since localhost on a phone is the phone itself). It installs
with the launcher name "tt's pink oven" (INTERNET permission set) and uses
only the public anon key — never the service-role key. No Mailgun anywhere.

## 3. Sync test — record this for submission (most important)

**Before you record, verify the database is ready:**

```bash
node scripts/check-supabase.mjs
```

This confirms the `products` and `cart_items` tables exist and are readable with
the anon key. If `cart_items` is missing it says so explicitly — that failure is
otherwise invisible, because the app renders an empty cart rather than an error.

1. Website: log in with the test email account → add
   Chocolate Chip Cookie × 2.
2. Phone: open "tt's pink oven" → log in with the SAME email account →
   open Cart → expect Chocolate Chip Cookie × 2 (pull-to-refresh / reopen
   Cart re-fetches; Realtime updates it live when enabled).
3. Phone: add Taro Boba × 1.
4. Website: focus/refresh cart → expect Taro Boba × 1.

Suggested recording order: app icon on phone → login → menu products →
website cart with × 2 → phone cart showing × 2 → add Taro on phone →
website cart showing Taro.

## 4. Troubleshooting — "Unable to delete directory" / "Failed to remove build"

Because `mobile/` sits inside a **OneDrive**-synced folder, OneDrive's sync
service and leftover **Gradle daemons** hold transient locks on files under
`mobile\build\`. The symptoms are:

- `Execution failed for task ':app:cleanMergeDebugAssets' > java.io.IOException:
  Unable to delete directory ... mergeDebugAssets`
- `Flutter failed to delete a directory at "build\unit_test_assets"`
- `Failed to remove build. A program may still be using a file in the directory`

This is an environment problem, not a code or Gradle-config problem — the same
delete that Gradle reports as impossible usually succeeds manually a moment
later.

**Quick fix (Windows):** use the helper script, which stops the Gradle daemons
before deleting `build\`:

```powershell
cd mobile\tool
.\dev.ps1 -Clean
```

**Manual equivalent:**

```powershell
cd mobile\android
.\gradlew.bat --stop      # daemons survive a failed build and hold build\ open
cd ..
flutter clean
flutter run
```

**Permanent fix:** stop OneDrive from syncing the build output — right-click
`mobile\build` → *Always keep on this device* (and do the same for
`mobile\.dart_tool` and `mobile\android\.gradle`). This removes the lock at its
source. Excluding these folders from sync is safe: they are generated and are
already listed in `.gitignore`.

Note that stale assets from an earlier WebView-based version of this app can
linger in `mobile\build` (look for `flutter_inappwebview` under
`mergeDebugAssets\flutter_assets\packages\`). They are harmless leftovers from
before the app was ported to native Flutter, and disappear once `build\` is
deleted and regenerated.