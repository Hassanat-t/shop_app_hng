"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const sb: any = createClient();
      // Same Supabase Auth project the Flutter app uses — same user id both sides.
      const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
      if (error) { setError(error.message); return; }
      // Create the profile row expected by orders/cart FKs (best-effort; RLS may
      // require the session — the row is also creatable from the dashboard).
      try {
        if (data?.user) {
          await sb.from("profiles").upsert({ id: data.user.id, email: email.trim() });
        }
      } catch { /* profile creation is optional at signup */ }
      if (data?.session) {
        // Email confirmation OFF — user is already logged in.
        router.push("/");
        router.refresh();
      } else {
        // Email confirmation ON — user must confirm before first login.
        setInfo("Account created! Check your inbox to confirm your email, then log in.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-16 pb-16 text-center">
      <h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Join tt&apos;s pink oven</h1>
      <p className="mt-1 text-sm">Create an account — it works on the website and the mobile app</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {info && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{info}</p>}
      <form onSubmit={signup} className="mt-6 space-y-3 text-left">
        <input aria-label="Email" type="email" autoComplete="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[var(--pink)]/50 bg-white p-3 text-sm" />
        <input aria-label="Password" type="password" autoComplete="new-password" placeholder="Password (min 6 characters)"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--pink)]/50 bg-white p-3 text-sm" />
        <input aria-label="Confirm password" type="password" autoComplete="new-password" placeholder="Confirm password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-[var(--pink)]/50 bg-white p-3 text-sm" />
        <button disabled={busy} className="btn-wine w-full rounded-full py-3 text-sm font-bold disabled:opacity-60">
          {busy ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Have an account?{" "}
        <Link href="/login" className="font-bold text-[var(--wine)] underline">Log in</Link>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/" className="text-[#7a5a5a] underline">Back to the shop</Link>
      </p>
    </div>
  );
}
