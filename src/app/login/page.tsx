"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function google() {
    setError("");
    try {
      const sb: any = createClient();
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError("Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
      router.refresh();
    }
  }

  // Email/password uses the SAME Supabase Auth project as the mobile app,
  // so one account works on both clients with one shared cart.
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (!password) { setError("Enter your password."); return; }
    setBusy(true);
    try {
      const sb: any = createClient();
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(friendly(error.message)); return; }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-16 pb-16 text-center">
      <h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Welcome back</h1>
      <p className="mt-1 text-sm">Log in to your tt&apos;s pink oven account</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button onClick={google} className="btn-wine mt-6 w-full rounded-full py-3 text-sm font-bold">
        Continue with Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-[#7a5a5a]">
        <span className="h-px flex-1 bg-[var(--pink)]/50" />
        <span>or log in with email</span>
        <span className="h-px flex-1 bg-[var(--pink)]/50" />
      </div>
      <form onSubmit={login} className="space-y-3 text-left">
        <input aria-label="Email" type="email" autoComplete="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[var(--pink)]/50 bg-white p-3 text-sm" />
        <input aria-label="Password" type="password" autoComplete="current-password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--pink)]/50 bg-white p-3 text-sm" />
        <button disabled={busy} className="btn-wine w-full rounded-full py-3 text-sm font-bold disabled:opacity-60">
          {busy ? "LOGGING IN..." : "LOGIN"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        New here?{" "}
        <Link href="/signup" className="font-bold text-[var(--wine)] underline">Create an account</Link>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/" className="text-[#7a5a5a] underline">Back to the shop</Link>
      </p>
    </div>
  );
}

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or password. Please try again.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first (check your inbox), then log in.";
  return msg || "Something went wrong. Please try again.";
}

