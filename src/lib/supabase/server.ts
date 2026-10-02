export async function createClient(): Promise<any> {
  // SSR Supabase client. Requires: npm install @supabase/ssr @supabase/supabase-js
  // Falls back gracefully when env/ deps are missing so `npm run build` works pre-setup.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServerClient } = require("@supabase/ssr");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require("next/headers");
    const store = await cookies();
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (c: { name: string; value: string; options?: object }[]) => {
          try { c.forEach(({ name, value, options }: { name: string; value: string; options?: object }) => store.set(name, value, options)); } catch { /* noop */ }
        },
      },
    });
  } catch {
    return {
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [] }) }), single: async () => ({ data: null }) }) }),
    };
  }
}
export function createServiceClient(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

