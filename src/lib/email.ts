export function orderEmailHtml(o: { customer_name: string; order_number: string; items: { product_name: string; quantity: number; unit_price: number; line_total: number }[]; subtotal: number; delivery_fee: number; total: number; fulfilment_method: string; delivery_address?: string; }) {
  const rows = o.items.map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_name} x ${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₦${i.line_total.toLocaleString()}</td></tr>`).join("");
  return `<div style="font-family:Arial;background:#FFF5F7;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden"><div style="background:#670625;color:#fff;padding:20px"><h1>tt's pink oven 💗</h1><p>Your order is confirmed!</p></div><div style="padding:20px"><p>Hi ${o.customer_name},</p><p>Order <b>${o.order_number}</b> (${o.fulfilment_method})</p><table style="width:100%;border-collapse:collapse">${rows}</table><p>Subtotal: ₦${o.subtotal.toLocaleString()}<br/>Delivery: ₦${o.delivery_fee.toLocaleString()}<br/><b>Total: ₦${o.total.toLocaleString()}</b></p>${o.delivery_address ? `<p>Deliver to: ${o.delivery_address}</p>` : ""}</div></div></div>`;
}
export async function sendOrderEmail(to: string, subject: string, html: string) {
  const key = process.env.MAILGUN_API_KEY, domain = process.env.MAILGUN_DOMAIN, from = process.env.MAILGUN_FROM_EMAIL;
  if (!key || !domain || !from) { console.warn("Mailgun not configured, skipping email to", to); return; }
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${key}`).toString("base64") },
    body: new URLSearchParams({ from, to, subject, html }),
  });
  if (!res.ok) console.error("Mailgun failed", await res.text());
}
