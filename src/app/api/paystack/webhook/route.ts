import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { completePaystackPayment, hasDb, PaymentError } from "@/lib/orders";

// POST /api/paystack/webhook — Paystack calls this when a payment succeeds.
// It is the backup path to the verify page: if the customer pays and closes the tab
// before being redirected back, the order is still created here.
//
// Safe by design:
//  - Only accepts requests signed with our secret key (x-paystack-signature).
//  - Re-confirms the payment with Paystack's verify endpoint before acting.
//  - Idempotent: Paystack may send the same event more than once, and the verify
//    page may have already created the order; place_order returns the existing one.
//
// Set the URL in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://<your-site>/api/paystack/webhook

export const runtime = "nodejs";

function validSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !hasDb()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  // The signature is computed over the exact bytes Paystack sent, so read the raw text.
  const rawBody = await req.text();
  if (!validSignature(rawBody, req.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Acknowledge events we don't act on, so Paystack stops retrying them.
  const reference = event.data?.reference;
  if (event.event !== "charge.success" || !reference) return NextResponse.json({ received: true });

  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const result = await completePaystackPayment(createServiceClient(), reference);
    if (!result) console.warn("Webhook: no pending payment for reference", reference);
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof PaymentError) {
      // Not retryable (failed or mismatched payment): log for manual review and acknowledge.
      console.error("Webhook: payment rejected", reference, e.message);
      return NextResponse.json({ received: true });
    }
    // Temporary problem (database or network): a 500 makes Paystack retry later.
    console.error("Webhook: could not complete order", reference, e);
    return NextResponse.json({ error: "Try again later" }, { status: 500 });
  }
}
