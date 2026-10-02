"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-[var(--light-pink)]/90 backdrop-blur border-b border-[var(--pink)]/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif-d text-2xl font-bold text-[var(--wine)]">tt&apos;s pink oven</Link>
        <nav className="hidden md:flex gap-7 text-sm tracking-widest font-semibold text-[var(--wine)]">
          <Link href="/">HOME</Link>
          <Link href="/menu">MENU</Link>
          <Link href="/#story">OUR STORY</Link>
          <Link href="/#contact">CONTACT</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cart" aria-label="Cart" className="rounded-full border border-[var(--wine)] px-3 py-1.5 text-sm font-bold text-[var(--wine)]">🛒 {count > 0 ? `(${count})` : ""}</Link>
          <Link href="/account/orders" aria-label="Account" className="rounded-full bg-[var(--wine)] px-3 py-1.5 text-sm font-bold text-white">Account</Link>
          <button className="md:hidden rounded-full border px-3 py-1.5" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-2 font-semibold text-[var(--wine)]">
          <Link href="/" onClick={() => setOpen(false)}>HOME</Link>
          <Link href="/menu" onClick={() => setOpen(false)}>MENU</Link>
          <Link href="/#story" onClick={() => setOpen(false)}>OUR STORY</Link>
          <Link href="/#contact" onClick={() => setOpen(false)}>CONTACT</Link>
          <Link href="/login" onClick={() => setOpen(false)}>LOGIN</Link>
        </nav>
      )}
    </header>
  );
}
