import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sigOf(options: { label: string; value: string }[] = []) {
  return [...options]
    .map((o) => `${o.label}=${o.value}`)
    .sort()
    .join(",");
}

// GET /api/cart — authenticated user's server-side cart (shared with mobile app)
export async function GET() {
  const sb: any = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });
  const { data, error } = await sb
    .from("cart_items")
    .select("quantity, options, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at");
  if (error) return NextResponse.json({ error: "Could not load cart." }, { status: 500 });
  const items = (data ?? [])
    .filter((r: any) => r.product)
    .map((r: any) => ({
      product: r.product,
      quantity: r.quantity,
      options: r.options ?? [],
      lineKey: `${r.product.slug || r.product.id}|${sigOf(r.options ?? [])}`,
    }));
  return NextResponse.json({ items });
}

// POST /api/cart — upsert a line: { product_id, quantity, options? }
export async function POST(req: Request) {
  const sb: any = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const body = await req.json().catch(() => null) as {
    product_id?: string; slug?: string; quantity?: number;
    options?: { label: string; value: string; priceDelta?: number }[];
  } | null;
  if (!body || (!body.product_id && !body.slug)) return NextResponse.json({ error: "product_id required." }, { status: 400 });
  const rawQty = Number(body.quantity ?? 1);
  const qty = !Number.isFinite(rawQty) ? 1 : Math.max(0, Math.min(50, Math.floor(rawQty)));
  const options = (body.options ?? []).map((o) => ({ label: o.label, value: o.value, priceDelta: o.priceDelta ?? 0 }));
  const sig = sigOf(options);

  // Resolve slug -> product id first (fallback catalogue ids like
  // "p-choc-chip" are not UUIDs and would violate the FK).
  let productId = body.product_id as string;
  if (body.slug) {
    const { data } = await sb.from("products").select("id").eq("slug", body.slug).single();
    if (!data) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    productId = data.id;
  }
  if (qty === 0) {
    await sb.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId).eq("options_sig", sig);
    return NextResponse.json({ ok: true });
  }
  const { error } = await sb.from("cart_items").upsert(
    { user_id: user.id, product_id: productId, quantity: qty, options, options_sig: sig },
    { onConflict: "user_id,product_id,options_sig" }
  );
  if (error) return NextResponse.json({ error: "Could not update cart." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/cart — clear whole cart (mobile + website "clear" after order)
export async function DELETE() {
  const sb: any = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  await sb.from("cart_items").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
