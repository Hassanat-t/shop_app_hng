/**
 * Pre-flight check for the shared-cart sync demo.
 *
 * The mobile app and the website both read/write the same Supabase
 * `cart_items` table. If supabase/cart.sql has not been run, the app still
 * launches and the cart silently renders as "empty" — which looks like a
 * broken sync but is really a missing table. Run this first:
 *
 *   node scripts/check-supabase.mjs
 *
 * Exit code 0 = ready to record. Exit code 1 = fix the problems listed first.
 *
 * Reads .env.local for the URL and publishable (anon) key. Never prints
 * secrets, and never uses the service-role key.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    console.error(`Could not read ${path}`);
    process.exit(1);
  }
  return out;
}

const env = loadEnv(new URL("../.env.local", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing from .env.local");
  process.exit(1);
}

const sb = createClient(url, key);
const problems = [];
const notes = [];

console.log(`Checking Supabase project ${new URL(url).host}\n`);

// 1. Products must exist and be readable with the anon key.
const { data: products, error: pErr } = await sb
  .from("products")
  .select("id, slug, is_active")
  .eq("is_active", true);

if (pErr) {
  problems.push(`products table not readable: ${pErr.message} (is supabase/schema.sql applied?)`);
} else if (!products?.length) {
  problems.push("products table is empty — the menu will render blank. Seed your products.");
} else {
  console.log(`  OK  products readable (${products.length} active)`);
}

// 2. cart_items must exist. PGRST205 is PostgREST saying the table is absent
//    from the schema cache, which is the exact signal that cart.sql was never
//    run. Any other failure (e.g. 42501) means the table is there but RLS is
//    hiding rows, which is normal for a signed-out anon request.
const { error: cErr } = await sb.from("cart_items").select("user_id").limit(1);

if (!cErr) {
  console.log("  OK  cart_items exists and is queryable");
} else if (cErr.code === "PGRST205" || /Could not find the table/i.test(cErr.message)) {
  problems.push(
    "cart_items table is MISSING — run supabase/cart.sql in the Supabase SQL editor.\n" +
      "      This is the #1 cause of 'the cart is always empty' during the sync demo.",
  );
} else if (cErr.code === "42501") {
  notes.push("cart_items exists; rows are hidden by RLS for signed-out users (expected).");
} else {
  problems.push(`cart_items query failed unexpectedly (${cErr.code}): ${cErr.message}`);
}

// 3. Realtime is optional for the recorded demo (both sides refresh manually),
//    but flag it because the guide advertises live updates.
notes.push(
  "Realtime for cart_items is NOT verified by this script. The demo works without it\n" +
    "      because both clients refresh on demand, but live updates need the table\n" +
    "      added to the supabase_realtime publication (Database -> Replication).",
);

if (notes.length) {
  console.log("\nNotes:");
  for (const n of notes) console.log(`  - ${n}`);
}

if (problems.length) {
  console.error("\nNOT READY:");
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}

console.log("\nREADY to run the sync demo (RUNNING_GUIDE.md section 3).");