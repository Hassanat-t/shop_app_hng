"use client";
import { useState } from "react";
import type { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
export default function MenuGrid({ products }: { products: Product[] }) {
  const [cat, setCat] = useState<"all" | "cookies" | "boba">("all");
  const list = products.filter((p) => cat === "all" || p.category === cat);
  return (
    <div>
      <div className="mt-6 flex gap-2">
        {(["all", "cookies", "boba"] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-5 py-2 text-xs font-bold tracking-widest ${cat === c ? "bg-[var(--wine)] text-white" : "border border-[var(--wine)] text-[var(--wine)]"}`}>{c.toUpperCase()}</button>
        ))}
      </div>
      {list.length === 0 ? <p className="py-10 text-center">No treats here yet. Please check back soon.</p> : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
