"use client";
import Link from "next/link";
import type { Product } from "@/types";
import { formatNGN } from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { add, items, setQty } = useCart();
  // Total of this product in cart (all option variants), keyed by slug so
  // fallback-catalogue and Supabase rows for the same product merge.
  const qtyInCart = items
    .filter((i) => (i.product.slug || i.product.id) === (product.slug || product.id))
    .reduce((s, i) => s + i.quantity, 0);
  // Single-variant line key (no options) for direct +/- on the card.
  const baseLine = items.find(
    (i) =>
      (i.product.slug || i.product.id) === (product.slug || product.id) &&
      (i.options ?? []).length === 0
  );
  const inc = () => add(product, 1);
  const dec = () => {
    if (baseLine) {
      setQty(baseLine.lineKey, baseLine.quantity - 1);
    } else if (qtyInCart > 0) {
      // Product is in cart only with options (e.g. boba size): remove one
      // from the first matching line so the count still goes down.
      const first = items.find(
        (i) => (i.product.slug || i.product.id) === (product.slug || product.id)
      );
      if (first) setQty(first.lineKey, first.quantity - 1);
    }
  };
  return (
    <div className="card-hover fade-in rounded-2xl bg-[var(--cream)] p-3 shadow-sm border border-[var(--pink)]/30">
      <Link href={`/menu/${product.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} className="h-44 w-full rounded-xl object-cover bg-[var(--light-pink)]" />
      </Link>
      {product.badge && <span className="mt-2 inline-block rounded-full bg-[var(--wine)] px-2 py-0.5 text-[10px] font-bold text-white">{product.badge}</span>}
      <Link href={`/menu/${product.slug}`} className="mt-1 block font-bold text-[var(--wine)]">{product.name}</Link>
      <p className="text-xs text-[#7a5a5a] line-clamp-2">{product.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-[var(--wine)]">{formatNGN(product.price)}</span>
        {qtyInCart === 0 ? (
          <button onClick={inc} aria-label={`Add ${product.name} to cart`} className="rounded-full bg-[var(--wine)] w-8 h-8 text-white font-bold text-lg leading-none">+</button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={dec} aria-label={`Remove one ${product.name} from cart`} className="rounded-full border border-[var(--wine)] text-[var(--wine)] w-7 h-7 font-bold leading-none">−</button>
            <span aria-live="polite" className="min-w-6 text-center text-sm font-bold text-[var(--wine)]">{qtyInCart}</span>
            <button onClick={inc} aria-label={`Add one more ${product.name} to cart`} className="rounded-full bg-[var(--wine)] w-7 h-7 text-white font-bold leading-none">+</button>
          </div>
        )}
      </div>
    </div>
  );
}
