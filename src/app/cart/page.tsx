"use client";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatNGN } from "@/data/products";
export default function CartPage() {
  const { items, subtotal, count, setQty, remove } = useCart();
  if (items.length === 0)
    return <div className="mx-auto max-w-3xl px-4 pt-16 text-center"><h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Your cart is empty</h1><p className="mt-2 text-sm">Something sweet is waiting for you.</p><Link href="/menu" className="btn-wine mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold">CONTINUE SHOPPING</Link></div>;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Your Cart ({count})</h1>
      <div className="mt-6 space-y-3">
        {items.map((i) => {
          const unit = i.product.price + (i.options ?? []).reduce((s, o) => s + (o.priceDelta ?? 0), 0);
          return (
            <div key={i.lineKey} className="flex gap-4 rounded-2xl bg-[var(--cream)] border border-[var(--pink)]/30 p-3 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.product.image_url} alt={i.product.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-[var(--wine)]">{i.product.name}</p>
                {(i.options ?? []).map((o) => <p key={o.label} className="text-xs">{o.label}: {o.value}</p>)}
                <p className="text-sm font-bold">{formatNGN(unit)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button aria-label="Decrease" className="border rounded-full w-7 h-7" onClick={() => setQty(i.lineKey, i.quantity - 1)}>−</button>
                  <span className="font-bold text-sm">{i.quantity}</span>
                  <button aria-label="Increase" className="border rounded-full w-7 h-7" onClick={() => setQty(i.lineKey, i.quantity + 1)}>+</button>
                  <button onClick={() => remove(i.lineKey)} className="ml-2 text-xs underline">Remove</button>
                </div>
              </div>
              <p className="font-bold text-[var(--wine)]">{formatNGN(unit * i.quantity)}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-2xl bg-white p-5 border">
        <div className="flex justify-between font-bold text-[var(--wine)]"><span>Subtotal</span><span>{formatNGN(subtotal)}</span></div>
        <div className="mt-4 flex gap-3">
          <Link href="/menu" className="flex-1 text-center rounded-full border border-[var(--wine)] py-3 text-sm font-bold text-[var(--wine)]">CONTINUE SHOPPING</Link>
          <Link href="/checkout" className="btn-wine flex-1 text-center rounded-full py-3 text-sm font-bold">PROCEED TO CHECKOUT</Link>
        </div>
      </div>
    </div>
  );
}
