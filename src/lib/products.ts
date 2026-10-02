import { createClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types";
const useDb = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
export async function getProducts(): Promise<Product[]> {
  if (!useDb) return PRODUCTS;
  try {
    const sb: any = await createClient();
    const { data } = await sb.from("products").select("*").eq("is_active", true).order("created_at");
    if (!data?.length) return PRODUCTS;
    return data as Product[];
  } catch { return PRODUCTS; }
}
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}
