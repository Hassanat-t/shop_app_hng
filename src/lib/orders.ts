import { PRODUCTS } from "@/data/products";
import { orderEmailHtml, sendOrderEmail } from "@/lib/email";
import { paystackVerify } from "@/lib/paystack";

// Shared order logic for the checkout API and the Paystack webhook.
// Prices are whole naira in the database; Paystack amounts are kobo (naira × 100).

export const DELIVERY_FEE = 1500;

type ItemInput = {
  product_id?: string;
  slug?: string;
  quantity: number;
  options?: { label: string; value: string; priceDelta?: number }[];
};

export type OrderInput = {
  customer_name: string;
  email: string;
  phone: string;
  fulfilment_method: "pickup" | "delivery";
  delivery_address: string;
  notes: string;
  payment_reference: string;
  items: ItemInput[];
};

export type OrderLine = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type Catalogue = Record<string, { id: string; name: string; price: number }>;

export function validate(body: unknown): OrderInput | null {
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
    customer_name: b.customer_name,
    email: b.email,
    phone: b.phone,
    fulfilment_method: b.fulfilment_method,
    delivery_address: (b.delivery_address as string) || "",
    notes: (b.notes as string) || "",
    payment_reference: (b.payment_reference as string) || "",
    items: b.items as ItemInput[],
  };
}

export function buildLines(items: ItemInput[], catalogue: Catalogue) {
  let subtotal = 0;
  const lines: OrderLine[] = [];
  for (const it of items) {
    const found = catalogue[it.slug || it.product_id || ""];
    if (!found) return null;
    const optDelta = (it.options ?? []).reduce(
      (s, o) => s + (Number(o.priceDelta) > 0 && o.label === "Size" && o.value === "Large" ? 500 : 0),
      0,
    );
    const unit = found.price + optDelta;
    const line = unit * it.quantity;
    subtotal += line;
    const optionText = (it.options ?? []).length ? ` (${(it.options ?? []).map((o) => o.value).join(", ")})` : "";
    lines.push({ product_id: found.id, product_name: found.name + optionText, unit_price: unit, quantity: it.quantity, line_total: line });
  }
  return { subtotal, lines };
}

export const hasDb = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function loadCatalogue(): Promise<Catalogue> {
  const catalogue: Catalogue = {};
  if (hasDb()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const svc = createServiceClient();
      const { data: rows } = await svc.from("products").select("id,name,slug,price").eq("is_active", true);
      ((rows ?? []) as { id: string; name: string; slug: string; price: number }[]).forEach((r) => {
        catalogue[r.slug] = r;
        catalogue[r.id] = r;
      });
      if (Object.keys(catalogue).length) return catalogue;
    } catch {
      /* fall through to the local catalogue */
    }
  }
  PRODUCTS.forEach((p) => {
    catalogue[p.slug] = { id: p.id, name: p.name, price: p.price };
    catalogue[p.id] = { id: p.id, name: p.name, price: p.price };
  });
  return catalogue;
}

export const newOrderNumber = () =>
  `TPO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

type OrderRecord = Omit<OrderInput, "items" | "payment_reference"> & {
  user_id: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
};

/**
 * Creates the order and its items in ONE database transaction (place_order in
 * supabase/payments-hardening.sql). With a payment reference it is idempotent:
 * a second call for the same reference returns the existing order (created: false).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function placeOrder(svc: any, order: OrderRecord, lines: OrderLine[], reference: string | null) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await svc.rpc("place_order", {
      p_order: { ...order, order_number: newOrderNumber() },
      p_items: lines,
      p_reference: reference,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row) return row as { order_id: string; order_number: string; created: boolean };
    // No row back = the random order number clashed; try again with a new one.
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not create order");
}

async function emailOrder(order: OrderRecord, orderNumber: string, lines: OrderLine[]) {
  try {
    await sendOrderEmail(
      order.email,
      "Your tt's pink oven order is confirmed 💗",
      orderEmailHtml({ ...order, order_number: orderNumber, items: lines }),
    );
  } catch (e) {
    console.error("Email failed", e);
  }
}

export class PaymentError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Turns a Paystack payment into an order, safely and exactly once.
 * Used by both the verify page (via /api/orders) and the Paystack webhook.
 *  - Loads what was priced at checkout from pending_payments (never from the browser).
 *  - Confirms with Paystack that the payment succeeded for exactly that amount.
 *  - Creates the order atomically; a repeat call returns the same order.
 *  - Sends the confirmation email only when the order is first created.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function completePaystackPayment(svc: any, reference: string, expectedUserId?: string) {
  const { data: pending } = await svc
    .from("pending_payments")
    .select("reference,user_id,payload,lines,subtotal,delivery_fee,total,status")
    .eq("reference", reference)
    .maybeSingle();
  if (!pending) return null;

  if (expectedUserId && pending.user_id !== expectedUserId) {
    throw new PaymentError("This payment belongs to another account.", 403);
  }

  const verified = await paystackVerify(reference);
  if (verified.status !== "success") throw new PaymentError("Payment was not successful. Please try again.", 402);
  if (verified.amount !== pending.total * 100) throw new PaymentError("Payment amount mismatch. Please contact us.", 402);

  const payload = pending.payload as OrderInput;
  let lines = pending.lines as OrderLine[] | null;
  if (!lines) {
    // Rows saved before this change have no stored lines: rebuild them and require the same subtotal.
    const built = buildLines(payload.items, await loadCatalogue());
    if (!built || built.subtotal !== pending.subtotal) throw new PaymentError("Order details changed. Please contact us.", 409);
    lines = built.lines;
  }

  const order: OrderRecord = {
    user_id: pending.user_id,
    customer_name: payload.customer_name,
    email: payload.email,
    phone: payload.phone,
    fulfilment_method: payload.fulfilment_method,
    delivery_address: payload.delivery_address,
    notes: payload.notes,
    subtotal: pending.subtotal,
    delivery_fee: pending.delivery_fee,
    total: pending.total,
  };

  const result = await placeOrder(svc, order, lines, reference);
  if (result.created) await emailOrder(order, result.order_number, lines);
  return { order_number: result.order_number, subtotal: order.subtotal, delivery_fee: order.delivery_fee, total: order.total, created: result.created };
}

/** Pay-on-pickup/delivery orders (Paystack not configured). Still atomic. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function placeUnpaidOrder(svc: any, order: OrderRecord, lines: OrderLine[]) {
  const result = await placeOrder(svc, order, lines, null);
  await emailOrder(order, result.order_number, lines);
  return result.order_number;
}
