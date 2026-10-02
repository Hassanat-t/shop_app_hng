import Link from "next/link";
export default function Footer() {
  return (
    <footer id="contact" className="bg-[var(--wine)] text-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-serif-d text-2xl font-bold">tt&apos;s pink oven</p>
          <p className="mt-2 text-sm text-white/80">Thin cookies. Creamy boba. Good vibes.</p>
        </div>
        <div>
          <p className="font-bold tracking-widest text-sm">NAVIGATION</p>
          <ul className="mt-2 space-y-1 text-sm text-white/85">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/account/orders">My Orders</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold tracking-widest text-sm">CONTACT</p>
          <p className="mt-2 text-sm text-white/85">hello@ttpinkoven.shop<br />Lagos, Nigeria<br />Mon–Sat · 9am–8pm</p>
        </div>
        <div>
          <p className="font-bold tracking-widest text-sm">FOLLOW</p>
          <p className="mt-2 text-sm text-white/85">Instagram · TikTok · WhatsApp (placeholders)</p>
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs text-white/70">© {new Date().getFullYear()} tt&apos;s pink oven. All rights reserved.</div>
    </footer>
  );
}
