# Google sign-in setup (one-time, ~10 min)

The mobile app supports the SAME Google OAuth as the website (same Supabase
Auth project → same `auth.users.id` → same cart + orders).

## 1. Supabase dashboard (same project as the website)
- Auth → Sign In → **Google: ON** with the existing web client id + secret
  (the website already uses these — do not create a second provider).

## 2. Google Cloud console (same GCP project as the web OAuth client)
- APIs & Services → Credentials → **Create Credentials → OAuth client ID →
  Android**:
  - Package name: `com.ttpinkoven.tt_pink_oven_mobile` (see
    `android/app/build.gradle.kts` `applicationId`)
  - SHA-1: your keystore fingerprint. Debug:
    ```bash
    keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android
    ```
  - For the release APK/AAB you submit, create a second Android client with
    the release keystore SHA-1.
- Copy the existing **Web client ID** (`xxx.apps.googleusercontent.com`).

## 3. Run the app with the Web client id (never commit it)
```bash
flutter run --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
```
(Email/password login keeps working without this; only the Google button
needs it. Missing/consent misconfiguration shows a setup hint, not a crash.)
