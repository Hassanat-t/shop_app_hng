import { NextResponse } from "next/server";
import { orderEmailHtml, sendOrderEmail } from "@/lib/email";
import { PRODUCTS } from "@/data/products";
import { paystackInit, paystackVerify, SITE_URL } from "@/lib/paystack";

const DELIVERY_FEE = 1500;

function validate(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.customer_name !== "string" || b.customer_name.length < 2) return null;
  if (typeof b.email !== "string" || !b.email.includes("@")) return null;
  if (typeof b.phone !== "string" || b.phone.length < 5) return null;
  if (b.fulfilment_method !== "pickup" && b.fulfilment_method !== "delivery") return null;
  if (!Array.isArray(b.items) || b.items.length === 0) return null;
  for (const it of b.items as Record<string, unknown>[]) {
    if (typeof it.quantity !== "number" || it.quantity < 1 || it.quantity > 50) return null;
    if (typeof it.product_id !== "string" && typeof it.slug !== "string") return null;
  }
  return {
    customer_name: b.customer_name as string,
    email: b.email as string,
    phone: b.phone as string,
    fulfilment_method: b.fulfilment_method as "pickup" | "delivery",
    delivery_address: (b.delivery_address as string) || "",
    notes: (b.notes as string) || "",
    payment_reference: (b.payment_reference as string) || "",
    items: (b.items as { product_id?: string; slug?: string; quantity: number; options?: { label: string; value: string; priceDelta?: number }[] }[]),
  };
}

async function buildLines(items: { product_id?: string; slug?: string; quantity: number; options?: { label: string; value: string; priceDelta?: number }[] }[], dbProducts: Record<string, { id: string; name: string; price: number }>) {
  let subtotal = 0;
  const lines: { product_id: string; product_name: string; unit_price: number; quantity: number; line_total: number }[] = [];
  for (const it of items) {
    const key = it.slug || it.product_id || "";
    const found = dbProducts[key];
    if (!found) return null;
    const optDelta = (it.options ?? []).reduce((s, o) => s + (Number(o.priceDelta) > 0 && o.label === "Size" && o.value === "Large" ? 500 : 0), 0);
    const unit = found.price + optDelta;
    const line = unit * it.quantity;
    subtotal += line;
    lines.push({ product_id: found.id, product_name: found.name + ((it.options ?? []).length ? ` (${(it.options ?? []).map((o) => o.value).join(", ")})` : ""), unit_price: unit, quantity: it.quantity, line_total: line });
  }
  return { subtotal, lines };
}

async function loadCatalogue(): Promise<Record<string, { id: string; name: string; price: number }>> {
  const dbProducts: Record<string, { id: string; name: string; price: number }> = {};
  const hasDb = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (hasDb) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const svc: any = createServiceClient();
      const { data: rows } = await svc.from("products").select("id,name,slug,price").eq("is_active", true);
      ((rows ?? []) as { id: string; name: string; slug: string; price: number }[]).forEach((r) => { dbProducts[r.slug] = r; dbProducts[r.id] = r; });
      if (Object.keys(dbProducts).length) return dbProducts;
    } catch { /* fall through to local catalogue */ }
  }
  PRODUCTS.forEach((p) => { dbProducts[p.slug] = { id: p.id, name: p.name, price: p.price }; dbProducts[p.id] = { id: p.id, name: p.name, price: p.price }; });
  return dbProducts;
}


// POST /api/orders — two modes:
//  1. { ..., step: "init" } → validate, price server-side, return { payUrl, reference, total }
//     (creates NO order yet; called before redirecting to Paystack)
//  2. { ..., payment_reference } → verify payment with Paystack, then create the order.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = validate(body);
    if (!data) return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
    const step = (body as { step?: string }).step;

    const { createClient, createServiceClient } = await import("@/lib/supabase/server");
    const sb: any = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

    // Server-side price lookup — never trust client prices
    const hasDb = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbProducts = await loadCatalogue();
    const built = await buildLines(data.items, dbProducts);
    if (!built) return NextResponse.json({ error: "A product is unavailable." }, { status: 400 });
    const { subtotal, lines } = built;
    const delivery_fee = data.fulfilment_method === "delivery" ? DELIVERY_FEE : 0;
    const total = subtotal + delivery_fee;
    const paystackOn = !!process.env.PAYSTACK_SECRET_KEY;

    // STEP 1 — initialise Paystack payment (no order created yet)
    if (step === "init") {
      if (!paystackOn) {
        // Paystack not configured: fall back to direct order (e.g. pay on pickup)
        return NextResponse.json({ payUrl: null, total, subtotal, delivery_fee });
      }
      const reference = `TPO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        // Cache the pending order server-side so the callback can rebuild it safely.
        // Non-fatal: if the pending_payments table doesn't exist yet, payment still works
        // (verify page rebuilds the cart from the browser).
        if (hasDb) {
          try {
            const svc: any = createServiceClient();
            await svc.from("pending_payments").insert({
              reference, user_id: user.id, payload: { ...data, items: data.items },
              subtotal, delivery_fee, total, status: "initialized",
            });
          } catch (e) {
            console.error("pending_payments insert skipped (run supabase/paystack.sql):", e);
          }
        }
        const init = await paystackInit(data.email, total * 100, reference, `${SITE_URL}/checkout/verify?reference=${reference}`);
        return NextResponse.json({ payUrl: init.authorization_url, reference, total, subtotal, delivery_fee });
      } catch (e) {
        console.error("Paystack init failed", e);
        return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
      }
    }

    // STEP 2 — verify payment, then create the order
    if (paystackOn) {
      if (!data.payment_reference) return NextResponse.json({ error: "Payment reference missing. Please pay first." }, { status: 400 });
      let verifiedTotal = total;
      try {
        const v = await paystackVerify(data.payment_reference);
        if (v.status !== "success") return NextResponse.json({ error: "Payment was not successful. Please try again." }, { status: 402 });
        if (v.amount !== total * 100) return NextResponse.json({ error: "Payment amount mismatch. Please contact us." }, { status: 402 });
        verifiedTotal = v.amount / 100;
      } catch (e) {
        console.error("Paystack verify failed", e);
        return NextResponse.json({ error: "Could not verify payment. Please try again." }, { status: 500 });
      }
      void verifiedTotal;
    }

    const order_number = `TPO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (hasDb) {
      const svc: any = createServiceClient();
      const { data: order, error } = await svc.from("orders").insert({
        user_id: user.id, order_number, customer_name: data.customer_name, email: data.email,
        phone: data.phone, fulfilment_method: data.fulfilment_method, delivery_address: data.delivery_address,
        notes: data.notes, subtotal, delivery_fee, total, status: paystackOn ? "paid" : "pending",
        payment_reference: data.payment_reference || null,
      }).select("id").single();
      if (error || !order) return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
      const { error: e2 } = await svc.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
      if (e2) { await svc.from("orders").delete().eq("id", order.id); return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 }); }
      if (paystackOn && data.payment_reference) {
        try {
          await svc.from("pending_payments").update({ status: "completed" }).eq("reference", data.payment_reference);
        } catch (e) {
          console.error("pending_payments update skipped:", e);
        }
      }
    }

    try {
      await sendOrderEmail(data.email, "Your tt's pink oven order is confirmed 💗",
        orderEmailHtml({ customer_name: data.customer_name, order_number, items: lines, subtotal, delivery_fee, total, fulfilment_method: data.fulfilment_method, delivery_address: data.delivery_address }));
    } catch (e) { console.error("Email failed", e); }

    return NextResponse.json({ order_number, subtotal, delivery_fee, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
