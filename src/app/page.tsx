import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import ProductCard from "@/components/products/ProductCard";

export default function HomePage() {
  const best = PRODUCTS.filter((p) => ["chocolate-chip-thin","biscoff-thin","white-chocolate-thin","taro-boba"].includes(p.slug));
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-10 grid gap-8 md:grid-cols-2 items-center">
        <div className="fade-in">
          <h1 className="font-serif-d text-5xl md:text-6xl font-bold leading-[1.05] text-[var(--wine)]">THIN COOKIES.<br />GOOD VIBES.<br />BOBA TOO.</h1>
          <p className="mt-4 text-[#7a5a5a] max-w-md">Freshly baked thin cookies and creamy boba made for your sweet moments.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/menu" className="btn-wine rounded-full px-6 py-3 text-sm font-bold tracking-widest">ORDER NOW</Link>
            <Link href="/menu" className="rounded-full border border-[var(--wine)] px-6 py-3 text-sm font-bold tracking-widest text-[var(--wine)]">VIEW MENU</Link>
          </div>
          <div className="mt-8 flex gap-6 text-[11px] font-bold tracking-widest text-[var(--wine)]">
            <span>PREMIUM INGREDIENTS</span><span>FRESHLY MADE</span><span>MADE WITH LOVE</span>
          </div>
        </div>
        <div className="relative fade-in">
          <div className="rounded-[2rem] bg-[var(--cream)] border border-[var(--pink)]/40 p-6 grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/chocolate-chip.svg" alt="Chocolate chip thin cookie" className="rounded-2xl h-56 w-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/taro-boba.svg" alt="Taro boba" className="rounded-2xl h-56 w-full object-cover mt-8" />
          </div>
          <span className="absolute -top-3 right-6 rounded-full border border-[var(--wine)] bg-white px-4 py-2 text-xs font-bold text-[var(--wine)]">100% BAKED WITH LOVE</span>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 mt-16">
        <p className="text-xs tracking-widest font-bold text-[var(--wine)]">BEST SELLERS</p>
        <div className="flex items-end justify-between">
          <h2 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Your Favorites Right Here</h2>
          <Link href="/menu" className="rounded-full border px-4 py-2 text-xs font-bold text-[var(--wine)]">VIEW ALL</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">{best.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>
      <section id="story" className="mx-auto max-w-6xl px-4 mt-16 rounded-[2rem] bg-[var(--wine)] text-white p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <p className="text-xs tracking-widest text-[var(--pink)]">RELAX. SIP. ENJOY.</p>
          <h2 className="font-serif-d text-3xl md:text-4xl font-bold">BAKED WITH LOVE. SERVED WITH GOOD VIBES.</h2>
          <p className="mt-3 text-white/85 text-sm">tts pink oven combines thin, chewy cookies with creamy boba drinks.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {["Freshly made","Premium ingredients","Made with love","Sweet moments"].map((f) => (
            <div key={f} className="rounded-2xl bg-white/10 p-4 font-semibold">{f}</div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 mt-16 text-center">
        <h2 className="font-serif-d text-3xl font-bold text-[var(--wine)]">YOUR NEXT FAVOURITE TREAT IS WAITING.</h2>
        <Link href="/menu" className="btn-wine mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold tracking-widest">SHOP THE MENU</Link>
      </section>
    </div>
  );
}
