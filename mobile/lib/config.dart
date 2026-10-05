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
  // (Supabase dashboard → Auth → Sign In → Google, and .env.local
  // GOOGLE_CLIENT_ID). Needed so Google issues an id_token Android can hand
  // to Supabase, and so Supabase accepts it (aud must match).
  // This is a PUBLIC identifier (visible in the website's OAuth redirect),
  // not a secret — the client SECRET stays server-side only.
  // Override at build time if you ever rotate clients:
  //   flutter run --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '230500940509-44pc96ft7fak4d851tlpmatma9fr707n.apps.googleusercontent.com',
  );
  static const deliveryFee = 1500; // NGN — must match website DELIVERY_FEE
}
