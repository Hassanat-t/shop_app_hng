export function createClient(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createBrowserClient } = require("@supabase/ssr");
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  } catch {
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        getUser: async () => ({ data: { user: null } }),
        signInWithOAuth: async () => ({ error: { message: "Supabase not configured. Run: npm install @supabase/ssr @supabase/supabase-js zod" } }),
        signInWithPassword: async () => ({ error: { message: "Supabase not configured." } }),
        signUp: async () => ({ error: { message: "Supabase not configured." } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    };
  }
}



