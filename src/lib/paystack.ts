export const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
export const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function paystackInit(email: string, amountKobo: number, reference: string, callbackUrl: string) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: amountKobo, reference, callback_url: callbackUrl }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack init failed");
  return json.data as { authorization_url: string; reference: string };
}

export async function paystackVerify(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack verify failed");
  return json.data as { status: string; amount: number; reference: string; customer: { email: string } };
}
