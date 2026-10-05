// tt's pink oven — mobile config (public anon key only, never service_role).
class AppConfig {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://chsufmijtqowabnbhawh.supabase.co',
  );
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_XEQq29eC1_lBVBW00vCF7A_jKpyaojd',
  );
  // Google Web (server) client id — SAME Google OAuth client as the website
  // (Supabase dashboard → Auth → Sign In → Google). Needed so Supabase accepts
  // the mobile id_token. Override at build time, never commit secrets:
  //   flutter run --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );
  static const deliveryFee = 1500; // NGN — must match website DELIVERY_FEE
}
