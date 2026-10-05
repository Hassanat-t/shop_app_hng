"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let off = false;
    let sub: { unsubscribe: () => void } | null = null;
    (async () => {
      try {
        const sb: any = createClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!off) {
          setEmail(session?.user?.email ?? null);
          setAuthChecked(true);
        }
        const { data } = sb.auth.onAuthStateChange((_e: string, s: any) => {
          if (off) return;
          setEmail(s?.user?.email ?? null);
          setAuthChecked(true);
        });
        sub = data?.subscription ?? null;
      } catch {
        if (!off) setAuthChecked(true);
      }
    })();
    return () => { off = true; try { sub?.unsubscribe(); } catch { /* noop */ } };
  }, []);

  async function logout() {
    try {
      const sb: any = createClient();
      await sb.auth.signOut();
    } catch { /* still leave */ }
    setEmail(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

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
          {authChecked && email ? (
            <>
              <Link href="/account/orders" aria-label="Account" className="hidden sm:inline-block max-w-40 truncate rounded-full bg-[var(--wine)] px-3 py-1.5 text-sm font-bold text-white" title={email}>
                {email}
              </Link>
              <button onClick={logout} aria-label="Logout" className="rounded-full border border-[var(--wine)] px-3 py-1.5 text-sm font-bold text-[var(--wine)]">
                Logout
              </button>
            </>
          ) : authChecked ? (
            <>
              <Link href="/login" aria-label="Login" className="rounded-full border border-[var(--wine)] px-3 py-1.5 text-sm font-bold text-[var(--wine)]">
                Login
              </Link>
              <Link href="/signup" aria-label="Sign up" className="rounded-full bg-[var(--wine)] px-3 py-1.5 text-sm font-bold text-white">
                Sign Up
              </Link>
            </>
          ) : null}
          <button className="md:hidden rounded-full border px-3 py-1.5" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-2 font-semibold text-[var(--wine)]">
          <Link href="/" onClick={() => setOpen(false)}>HOME</Link>
          <Link href="/menu" onClick={() => setOpen(false)}>MENU</Link>
          <Link href="/#story" onClick={() => setOpen(false)}>OUR STORY</Link>
          <Link href="/#contact" onClick={() => setOpen(false)}>CONTACT</Link>
          {email ? (
            <>
              <Link href="/account/orders" onClick={() => setOpen(false)}>MY ORDERS</Link>
              <button onClick={logout} className="text-left">LOGOUT ({email})</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>LOGIN</Link>
              <Link href="/signup" onClick={() => setOpen(false)}>SIGN UP</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
