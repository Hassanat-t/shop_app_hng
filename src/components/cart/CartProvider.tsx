"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, CartOption, Product } from "@/types";

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
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
  // Avoid overwriting localStorage with [] before the saved cart has loaded.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(mergeItems(Array.isArray(parsed) ? parsed : []));
      }
    } catch { /* start with an empty cart */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items, loaded]);

  const value = useMemo<CartCtx>(() => {
    const priceOf = (i: CartItem) => i.product.price + (i.options ?? []).reduce((s, o) => s + (o.priceDelta ?? 0), 0);
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + priceOf(i) * i.quantity, 0),
      add: (p, qty = 1, options) => {
        const opts = normalizeOptions(options);
        const lineKey = keyFor(p, opts);
        setItems((prev) =>
          mergeItems([...prev, { product: p, quantity: qty, options: opts, lineKey }])
        );
      },
      setQty: (k, qty) => setItems((prev) => qty <= 0 ? prev.filter((i) => i.lineKey !== k) : prev.map((i) => (i.lineKey === k ? { ...i, quantity: qty } : i))),
      remove: (k) => setItems((prev) => prev.filter((i) => i.lineKey !== k)),
      clear: () => setItems([]),
    };
  }, [items]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
