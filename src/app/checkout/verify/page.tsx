"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { clear } = useCart();
  const [msg, setMsg] = useState("Verifying your payment...");
  const [error, setError] = useState("");
  const [debugRef, setDebugRef] = useState("");

  useEffect(() => {
    // The server saved the priced order before payment, so only the reference is
    // needed here. Refreshing this page is safe: the API returns the same order.
    let cancelled = false;
    async function run() {
      const reference = params.get("reference") || params.get("trxref");
      if (!reference) { setError("Payment reference missing."); return; }
      setDebugRef(reference);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_reference: reference }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError((json.error || "Could not confirm your order. Please contact us.") + ` (ref: ${reference})`); return; }
        try { localStorage.removeItem("tpo-pending-order"); } catch { /* ignore */ }
        clear();
        setMsg("Payment confirmed! Redirecting...");
        router.push(`/order-success/${json.order_number}`);
      } catch {
        if (!cancelled) setError("Network failure while verifying payment. Please contact us with reference " + reference);
      }
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
