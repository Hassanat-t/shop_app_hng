"use client";
import { useState } from "react";
import type { Product } from "@/types";
import { formatNGN } from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";
import ProductCard from "@/components/products/ProductCard";
export default function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("Regular");
  const sizeDelta = product.category === "boba" && size === "Large" ? 500 : 0;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} className="rounded-[1.5rem] w-full h-96 object-cover bg-[var(--cream)] border border-[var(--pink)]/40" />
        <div>
          <p className="text-xs tracking-widest font-bold text-[var(--wine)]">{product.category.toUpperCase()}</p>
          <h1 className="font-serif-d text-4xl font-bold text-[var(--wine)]">{product.name}</h1>
          <p className="mt-2 text-sm text-[#7a5a5a]">{product.description}</p>
          <p className="mt-4 text-2xl font-bold text-[var(--wine)]">{formatNGN(product.price + sizeDelta)}</p>
          {product.category === "boba" && (
            <div className="mt-4">
              <p className="text-sm font-bold">Size</p>
              <div className="flex gap-2 mt-1">
                {["Regular", "Large"].map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`rounded-full px-4 py-2 text-xs font-bold ${size === s ? "bg-[var(--wine)] text-white" : "border border-[var(--wine)] text-[var(--wine)]"}`}>{s}{s === "Large" ? " +₦500" : ""}</button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center border rounded-full">
              <button aria-label="Decrease" className="px-4 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="font-bold w-8 text-center">{qty}</span>
              <button aria-label="Increase" className="px-4 py-2" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button onClick={() => add(product, qty, product.category === "boba" ? [{ label: "Size", value: size, priceDelta: sizeDelta }] : undefined)} className="btn-wine rounded-full px-8 py-3 text-sm font-bold tracking-widest">ADD TO CART</button>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif-d text-2xl font-bold text-[var(--wine)]">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}
    </div>
  );
}
