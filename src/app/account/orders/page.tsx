import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNGN } from "@/data/products";

// Per-user data — must never be statically cached.
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const sb: any = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  let orders: { order_number: string; created_at: string; total: number; status: string; fulfilment_method: string }[] = [];
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const svc: any = createServiceClient();
      const { data } = await svc.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      orders = data ?? [];
    }
  } catch { /* show empty state */ }
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">My Orders</h1>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white border p-8 text-center text-sm">
          <p>No orders yet. Your sweet history will appear here.</p>
          <Link href="/menu" className="btn-wine mt-4 inline-block rounded-full px-6 py-3 text-xs font-bold">SHOP THE MENU</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.order_number} className="rounded-2xl bg-white border p-4 flex items-center justify-between text-sm">
              <div><p className="font-bold text-[var(--wine)]">{o.order_number}</p><p className="text-xs">{new Date(o.created_at).toLocaleString()} · {o.fulfilment_method} · {o.status}</p></div>
              <p className="font-bold">{formatNGN(o.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
