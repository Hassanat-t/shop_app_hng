"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, CartOption, Product } from "@/types";

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  synced: boolean;
  add: (p: Product, qty?: number, options?: CartOption[]) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "tpo-cart-v1";

function normalizeOptions(options?: CartOption[]): CartOption[] {
  return (options ?? []).map((o) => ({ label: o.label, value: o.value, priceDelta: o.priceDelta ?? 0 }));
}

function optionsSig(options?: CartOption[]) {
  return normalizeOptions(options)
    .map((o) => `${o.label}=${o.value}`)
    .sort()
    .join(",");
}

function keyFor(p: Product, options?: CartOption[]) {
  // Merge by slug (not DB id): fallback catalogue ids ("p-choc-chip") differ
  // from Supabase UUIDs for the same product, which caused duplicate rows.
  const id = p.slug || p.id;
  return id + "|" + optionsSig(options);
}

function mergeItems(list: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const i of list) {
    const options = normalizeOptions(i.options);
    const lineKey = keyFor(i.product, options);
    const item: CartItem = { ...i, options, lineKey };
    const existing = map.get(lineKey);
    if (existing) {
      map.set(lineKey, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      map.set(lineKey, item);
    }
  }
  return [...map.values()];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const uidRef = useRef<string | null>(null);
  uidRef.current = userId;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(mergeItems(Array.isArray(parsed) ? parsed : []));
      }
    } catch { /* start with an empty cart */ }
    setLoaded(true);
    let off = false;
    let sub: { unsubscribe: () => void } | null = null;
    (async () => {
      try {
        const sb: any = createClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!off) setUserId(session?.user?.id ?? null);
        const { data } = sb.auth.onAuthStateChange((_e: string, s: any) => {
          if (!off) setUserId(s?.user?.id ?? null);
        });
        sub = data?.subscription ?? null;
      } catch { /* guest mode */ }
    })();
    return () => { off = true; try { sub?.unsubscribe(); } catch { /* noop */ } };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items, loaded]);

  // Push one line to the shared server cart (no-op for guests).
  async function pushLine(product: Product, quantity: number, options: CartOption[]) {
    if (!uidRef.current) return;
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, slug: product.slug, quantity, options }),
      });
    } catch { /* best-effort; local cart stays correct */ }
  }

  async function pullShared() {
    try {
      const r = await fetch("/api/cart");
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.items)) setItems(mergeItems(j.items as CartItem[]));
      }
    } catch { /* ignore */ }
  }

  // When logged in: upload guest lines once, load shared cart, subscribe realtime.
  useEffect(() => {
    if (!loaded || !userId) { setSynced(false); return; }
    let off = false;
    let channel: any = null;
    (async () => {
      try {
        const sb: any = createClient();
        const guest = mergeItems(items);
        for (const g of guest.slice(0, 50)) {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: g.product.id, slug: g.product.slug, quantity: g.quantity, options: g.options ?? [] }),
          });
        }
        if (!off) { await pullShared(); setSynced(true); }
        try {
          channel = sb.channel(`cart-${userId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` }, () => { void pullShared(); })
            .subscribe();
        } catch { /* realtime optional */ }
      } catch { /* stay on local cart */ }
    })();
    return () => { off = true; try { channel?.unsubscribe?.(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, userId]);

  // Refetch shared cart when tab regains focus (mobile -> website sync).
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => { void pullShared(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const value = useMemo<CartCtx>(() => {
    const priceOf = (i: CartItem) => i.product.price + (i.options ?? []).reduce((s, o) => s + (o.priceDelta ?? 0), 0);
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + priceOf(i) * i.quantity, 0),
      synced: !!uidRef.current && synced,
      add: (p, qty = 1, options) => {
        const opts = normalizeOptions(options);
        const lineKey = keyFor(p, opts);
        setItems((prev) => {
          const next = mergeItems([...prev, { product: p, quantity: qty, options: opts, lineKey }]);
          const line = next.find((n) => n.lineKey === lineKey);
          void pushLine(p, line?.quantity ?? qty, opts);
          return next;
        });
      },
      setQty: (k, qty) => {
        const line = items.find((i) => i.lineKey === k);
        if (line && uidRef.current) void pushLine(line.product, Math.max(0, qty), line.options ?? []);
        setItems((prev) => qty <= 0 ? prev.filter((i) => i.lineKey !== k) : prev.map((i) => (i.lineKey === k ? { ...i, quantity: qty } : i)));
      },
      remove: (k) => {
        const line = items.find((i) => i.lineKey === k);
        if (line && uidRef.current) void pushLine(line.product, 0, line.options ?? []);
        setItems((prev) => prev.filter((i) => i.lineKey !== k));
      },
      clear: () => {
        if (uidRef.current) void fetch("/api/cart", { method: "DELETE" }).catch(() => {});
        setItems([]);
      },
    };
  }, [items, synced]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
