"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { items, clear } = useCart();
  const [msg, setMsg] = useState("Verifying your payment...");
  const [error, setError] = useState("");
  const [debugRef, setDebugRef] = useState("");

  useEffect(() => {
    async function run(cartItems: typeof items) {
      const reference = params.get("reference") || params.get("trxref");
      if (!reference) { setError("Payment reference missing."); return; }
      setDebugRef(reference);
      let saved: { form: Record<string, string>; reference: string } | null = null;
      try {
        const raw = localStorage.getItem("tpo-pending-order");
        if (raw) saved = JSON.parse(raw);
      } catch { /* ignore */ }
      if (!saved || cartItems.length === 0) {
        setError("Your session expired after payment. Please rebuild your cart and try again.");
        return;
      }
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...saved.form,
            payment_reference: reference,
            items: cartItems.map((i) => ({ product_id: i.product.id, slug: i.product.slug, quantity: i.quantity, options: i.options })),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError((json.error || "Could not confirm your order. Please contact us.") + ` (ref: ${reference})`); return; }
        try { localStorage.removeItem("tpo-pending-order"); } catch { /* ignore */ }
        clear();
        setMsg("Payment confirmed! Redirecting...");
        router.push(`/order-success/${json.order_number}`);
      } catch {
        setError("Network failure while verifying payment. Please contact us with reference " + reference);
      }
    }
    // Wait for the cart to hydrate from localStorage before verifying —
    // items is [] on first render, which wrongly triggered "session expired".
    if (items.length > 0) run(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="mx-auto max-w-md px-4 pt-16 text-center">
      <h1 className="font-serif-d text-2xl font-bold text-[var(--wine)]">Confirming payment</h1>
      {!error ? <p className="mt-2 text-sm">{msg}</p> : (
        <div>
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          {debugRef && <p className="mt-2 text-xs text-gray-500">Reference: {debugRef}</p>}
          <a href="/checkout" className="btn-wine mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold">BACK TO CHECKOUT</a>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 pt-16 text-center text-sm">Confirming payment...</p>}>
      <VerifyInner />
    </Suspense>
  );
}
