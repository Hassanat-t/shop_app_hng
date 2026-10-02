import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNGN } from "@/data/products";

// Order confirmation is per-order — always render live from the database.
export const dynamic = "force-dynamic";

export default async function OrderSuccess({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  let order: { order_number: string; subtotal: number; delivery_fee: number; total: number; fulfilment_method: string; email: string } | null = null;
  let items: { product_name: string; quantity: number; line_total: number }[] = [];
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const sb: any = await createClient();
      const { data } = await sb.from("orders").select("*").eq("order_number", orderNumber).single();
      if (data) {
        order = data;
        const { data: its } = await sb.from("order_items").select("*").eq("order_id", data.id);
        items = its ?? [];
      }
    }
  } catch { /* show order number only */ }
  return (
    <div className="mx-auto max-w-2xl px-4 pt-12 text-center">
      <h1 className="font-serif-d text-4xl font-bold text-[var(--wine)]">ORDER CONFIRMED 💗</h1>
      <p className="mt-2 text-sm">Thank you for ordering from tt&apos;s pink oven.</p>
      <div className="mt-6 rounded-2xl bg-white border p-6 text-left text-sm">
        <p><b>Order number:</b> {order?.order_number ?? orderNumber}</p>
        {order && (<>
          <p><b>Email:</b> {order.email}</p>
          <p><b>Fulfilment:</b> {order.fulfilment_method}</p>
          <div className="mt-3 space-y-1">{items.map((i, idx) => <div key={idx} className="flex justify-between"><span>{i.product_name} x {i.quantity}</span><span>{formatNGN(i.line_total)}</span></div>)}</div>
          <div className="mt-3 border-t pt-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatNGN(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatNGN(order.delivery_fee)}</span></div>
            <div className="flex justify-between font-bold text-[var(--wine)]"><span>Total</span><span>{formatNGN(order.total)}</span></div>
          </div>
        </>)}
        <p className="mt-3">A confirmation email has been sent to your email address.</p>
      </div>
      <div className="mt-6 flex gap-3 justify-center">
        <Link href="/" className="rounded-full border border-[var(--wine)] px-6 py-3 text-xs font-bold text-[var(--wine)]">BACK TO HOME</Link>
        <Link href="/account/orders" className="btn-wine rounded-full px-6 py-3 text-xs font-bold">VIEW MY ORDERS</Link>
      </div>
    </div>
  );
}
