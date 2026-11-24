import { NextResponse } from "next/server";
import { orderEmailHtml, sendOrderEmail } from "@/lib/email";
import { paystackInit, SITE_URL } from "@/lib/paystack";
import {
  buildLines,
  completePaystackPayment,
  DELIVERY_FEE,
  hasDb,
  loadCatalogue,
  newOrderNumber,
  PaymentError,
  placeUnpaidOrder,
  validate,
} from "@/lib/orders";

// POST /api/orders — two modes:
//  1. { ..., step: "init" } → validate, price server-side, save the priced order in
//     pending_payments, return { payUrl, reference, total }. Creates NO order yet.
//  2. { ..., payment_reference } → confirm the payment with Paystack and create the
//     order exactly once. Safe to call again (page refresh): returns the same order.
//     The Paystack webhook (/api/paystack/webhook) runs the same logic, so the order
//     is still created if the customer closes the tab before returning here.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
    const step = body.step;

    const { createClient, createServiceClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

    const paystackOn = !!process.env.PAYSTACK_SECRET_KEY;
    const db = hasDb();

    // STEP 2 — payment came back: confirm it and create the order (idempotent).
    // Only the reference is needed: the priced order was saved at step 1.
    if (step !== "init" && paystackOn) {
      const reference = typeof body.payment_reference === "string" ? body.payment_reference : "";
      if (!reference) return NextResponse.json({ error: "Payment reference missing. Please pay first." }, { status: 400 });
      if (!db) return NextResponse.json({ error: "Orders are not configured yet." }, { status: 500 });
      try {
        const result = await completePaystackPayment(createServiceClient(), reference, user.id);
        if (!result) return NextResponse.json({ error: "We couldn't find this payment. Please contact us." }, { status: 404 });
        return NextResponse.json(result);
      } catch (e) {
        if (e instanceof PaymentError) return NextResponse.json({ error: e.message }, { status: e.status });
        console.error("Paystack completion failed", e);
        return NextResponse.json({ error: "Could not verify payment. Please try again." }, { status: 500 });
      }
    }

    const data = validate(body);
    if (!data) return NextResponse.json({ error: "Invalid order details." }, { status: 400 });

    // Server-side price lookup — never trust client prices
    const built = buildLines(data.items, await loadCatalogue());
    if (!built) return NextResponse.json({ error: "A product is unavailable." }, { status: 400 });
    const { subtotal, lines } = built;
    const delivery_fee = data.fulfilment_method === "delivery" ? DELIVERY_FEE : 0;
    const total = subtotal + delivery_fee;

    // STEP 1 — initialise Paystack payment (no order created yet)
    if (step === "init") {
      if (!paystackOn) {
        // Paystack not configured: fall back to direct order (e.g. pay on pickup)
        return NextResponse.json({ payUrl: null, total, subtotal, delivery_fee });
      }
      if (!db) return NextResponse.json({ error: "Payments need the database configured." }, { status: 500 });
      const reference = `TPO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      try {
        // The priced order is saved BEFORE payment, so the verify step and the webhook
        // can create exactly what the customer paid for. Required: without it a paid
        // order could not be completed safely.
        const { error } = await createServiceClient().from("pending_payments").insert({
          reference,
          user_id: user.id,
          payload: { ...data, payment_reference: "" },
          lines,
          subtotal,
          delivery_fee,
          total,
          status: "initialized",
        });
        if (error) throw new Error(`pending_payments insert failed (run supabase/paystack.sql and payments-hardening.sql): ${error.message}`);
        const init = await paystackInit(data.email, total * 100, reference, `${SITE_URL}/checkout/verify?reference=${reference}`);
        return NextResponse.json({ payUrl: init.authorization_url, reference, total, subtotal, delivery_fee });
      } catch (e) {
        console.error("Paystack init failed", e);
        return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
      }
    }

    // Pay on pickup/delivery (Paystack not configured)
    let order_number = "";
    if (db) {
      order_number = await placeUnpaidOrder(
        createServiceClient(),
        { user_id: user.id, customer_name: data.customer_name, email: data.email, phone: data.phone, fulfilment_method: data.fulfilment_method, delivery_address: data.delivery_address, notes: data.notes, subtotal, delivery_fee, total },
        lines,
      );
    } else {
      // No database (demo mode): nothing is stored, but the customer still gets an email.
      order_number = newOrderNumber();
      try {
        await sendOrderEmail(data.email, "Your tt's pink oven order is confirmed 💗",
          orderEmailHtml({ customer_name: data.customer_name, order_number, items: lines, subtotal, delivery_fee, total, fulfilment_method: data.fulfilment_method, delivery_address: data.delivery_address }));
      } catch (e) { console.error("Email failed", e); }
    }
    return NextResponse.json({ order_number, subtotal, delivery_fee, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
