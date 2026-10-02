"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  async function google() {
    setError("");
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) setError("Something went wrong. Please try again.");
    } catch { setError("Something went wrong. Please try again."); router.refresh(); }
  }
  return (
    <div className="mx-auto max-w-md px-4 pt-16 text-center">
      <h1 className="font-serif-d text-3xl font-bold text-[var(--wine)]">Welcome to tt&apos;s pink oven</h1>
      <p className="mt-1 text-sm">Sign in to continue</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button onClick={google} className="btn-wine mt-6 w-full rounded-full py-3 text-sm font-bold">Continue with Google</button>
    </div>
  );
}
