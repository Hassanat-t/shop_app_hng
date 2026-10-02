"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatNGN } from "@/data/products";
import { createClient } from "@/lib/supabase/client";

const DELIVERY_FEE = 1500;
const PAYSTACK_ON = !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ customer_name: "", email: "", phone: "", fulfilment_method: "pickup" as "pickup" | "delivery", delivery_address: "", notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const total = subtotal + (form.fulfilment_method === "delivery" ? DELIVERY_FEE : 0);

  function payload(extra: Record<string, unknown> = {}) {
    return {
      ...form,
      ...extra,
      items: items.map((i) => ({ product_id: i.product.id, slug: i.product.slug, quantity: i.quantity, options: i.options })),
    };
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("Your cart is empty."); return; }
    if (!form.customer_name || !form.email || !form.phone) { setError("Please fill in your name, email and phone."); return; }
    if (form.fulfilment_method === "delivery" && !form.delivery_address) { setError("Please enter a delivery address."); return; }
    setLoading(true);
    try {
      const sb: any = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.push("/login"); return; }
      // STEP 1 — server prices the order and returns a Paystack link
      const initRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload({ step: "init" })),
      });
      const init = await initRes.json();
      if (!initRes.ok) { setError(init.error || "Something went wrong. Please try again."); return; }
      if (!init.payUrl) {
        // Paystack not configured — place order directly (pay on pickup/delivery)
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload()),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Something went wrong. Please try again."); return; }
        clear();
        router.push(`/order-success/${json.order_number}`);
        return;
      }
      try {
        localStorage.setItem("tpo-pending-order", JSON.stringify({ form, reference: init.reference }));
      } catch { /* verify page will handle missing data */ }
      window.location.href = init.payUrl as string;
    } catch { setError("Network failure. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 grid md:grid-cols-2 gap-8">
      <form onSubmit={placeOrder} className="rounded-2xl bg-white border p-6 space-y-3">
        <h1 className="font-serif-d text-2xl font-bold text-[var(--wine)]">Checkout</h1>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <input aria-label="Full name" placeholder="Full name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        <input aria-label="Email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        <input aria-label="Phone" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        <div className="flex gap-2">
          {(["pickup", "delivery"] as const).map((m) => (
            <button type="button" key={m} onClick={() => setForm({ ...form, fulfilment_method: m })} className={`flex-1 rounded-full py-2 text-xs font-bold ${form.fulfilment_method === m ? "bg-[var(--wine)] text-white" : "border"}`}>{m.toUpperCase()}</button>
          ))}
        </div>
        {form.fulfilment_method === "delivery" && (
          <textarea aria-label="Delivery address" placeholder="Delivery address" value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        )}
        <textarea aria-label="Order notes" placeholder="Order notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        <button disabled={loading} className="btn-wine w-full rounded-full py-3 text-sm font-bold">
          {loading ? "REDIRECTING TO PAYMENT..." : PAYSTACK_ON ? `PAY ${formatNGN(total)} WITH PAYSTACK` : "PLACE ORDER"}
        </button>
        {PAYSTACK_ON && <p className="text-center text-xs text-[#7a5a5a]">Test mode — use Paystack test card 4084 0840 8408 4081.</p>}
      </form>
      <div className="rounded-2xl bg-[var(--cream)] border border-[var(--pink)]/40 p-6 h-fit">
        <h2 className="font-bold text-[var(--wine)]">ORDER SUMMARY</h2>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((i) => <div key={i.lineKey} className="flex justify-between"><span>{i.product.name} x {i.quantity}</span><span>{formatNGN(i.product.price * i.quantity)}</span></div>)}
        </div>
        <div className="mt-4 border-t pt-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatNGN(subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery fee</span><span>{formatNGN(form.fulfilment_method === "delivery" ? DELIVERY_FEE : 0)}</span></div>
          <div className="flex justify-between font-bold text-[var(--wine)] text-lg"><span>Total</span><span>{formatNGN(total)}</span></div>
        </div>
      </div>
    </div>
  );
}
