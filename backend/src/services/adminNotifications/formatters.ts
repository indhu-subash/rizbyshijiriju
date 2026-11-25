// Builds the WhatsApp template parameters and the HTML/text email from an order. Pure functions.
export interface NotifyOrder {
  id: string; orderId: string; subtotal: number; discount: number; shippingCharge: number; total: number;
  couponCode?: string | null; paymentMethod: string; paymentStatus: string; orderStatus: string;
  shippingName: string; shippingPhone: string; shippingEmail: string; shippingAddressLine: string;
  shippingCity: string; shippingState: string; shippingPincode: string; shippingCountry?: string | null;
  createdAt: Date | string;
  items: { name: string; price: number; quantity: number; color?: string | null; size?: string | null; productCode?: string | null }[];
}

export const money = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

export function orderDateIST(d: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(d)) + ' IST';
}

export function paymentMethodLabel(m: string): string {
  const k = (m || '').toLowerCase();
  if (k === 'upi') return 'UPI (Razorpay)';
  if (k === 'card') return 'Card (Razorpay)';
  return m || '-';
}

export function paymentStatusLabel(o: Pick<NotifyOrder, 'paymentStatus' | 'paymentMethod'>): string {
  const s = (o.paymentStatus || '').toLowerCase();
  if (s === 'paid') return 'Paid';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '-';
}

export const variantLabel = (i: { color?: string | null; size?: string | null }) =>
  [i.color && `Colour: ${i.color}`, i.size && `Size: ${i.size}`].filter(Boolean).join(', ') || '-';

export const fullAddress = (o: NotifyOrder) =>
  [o.shippingAddressLine, o.shippingCity, o.shippingState, o.shippingPincode, o.shippingCountry].filter(Boolean).join(', ');

// ---- WhatsApp ---------------------------------------------------------------
/** Meta forbids newlines/tabs and 5+ consecutive spaces in template params, and empty params. */
export function waParam(v: unknown, max = 1024): string {
  const s = String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {5,}/g, '    ').trim();
  return (s || '-').slice(0, max);
}

export function whatsappItemsParam(o: NotifyOrder): string {
  const parts = o.items.map((i, idx) => `${idx + 1}) ${i.name} [${variantLabel(i)}] Qty ${i.quantity} x ${money(i.price)} = ${money(i.price * i.quantity)}`);
  let out = '';
  for (let k = 0; k < parts.length; k++) {
    const next = out ? `${out} | ${parts[k]}` : parts[k];
    if (next.length > 850 && k > 0) return `${out} | +${parts.length - k} more item(s) - see admin dashboard`;
    out = next;
  }
  return out;
}

/** Order of this array == {{1}}..{{16}} in the approved template (see docs/whatsapp-admin-order-template.md). */
export function buildWhatsAppParams(o: NotifyOrder): string[] {
  return [
    o.orderId, orderDateIST(o.createdAt), o.shippingName, o.shippingPhone, o.shippingEmail,
    whatsappItemsParam(o),
    paymentMethodLabel(o.paymentMethod), paymentStatusLabel(o),
    money(o.subtotal), money(o.shippingCharge), money(o.discount), money(o.total),
    o.shippingAddressLine, o.shippingCity, o.shippingState, o.shippingPincode,
  ].map((v) => waParam(v));
}

// ---- Email ------------------------------------------------------------------
export const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function buildEmail(o: NotifyOrder): { subject: string; html: string; text: string } {
  const subject = `New Order Confirmed – Order #${o.orderId}`;
  const rows = o.items.map((i) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#222">${esc(i.name)}${i.productCode ? `<br><span style="color:#888;font-size:12px">Code: ${esc(i.productCode)}</span>` : ''}<br><span style="color:#756a61;font-size:12px">${esc(variantLabel(i))}</span></td>
      <td align="center" style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px">${i.quantity}</td>
      <td align="right" style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;white-space:nowrap">${money(i.price)}</td>
      <td align="right" style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;white-space:nowrap">${money(i.price * i.quantity)}</td>
    </tr>`).join('');
  const kv = (k: string, v: string, bold = false) => `<tr><td style="padding:4px 0;color:#756a61;font-size:14px">${esc(k)}</td><td align="right" style="padding:4px 0;font-size:14px;${bold ? 'font-weight:700;font-size:16px;color:#334c3d' : 'color:#222'}">${v}</td></tr>`;
  const h = (t: string) => `<h3 style="margin:26px 0 8px;font:600 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a9895b">${esc(t)}</h3>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f3ed;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ed"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #ddd3c7">
 <tr><td style="background:#334c3d;padding:22px 28px;color:#ffffff"><div style="font:600 22px Georgia,serif;letter-spacing:.04em">RIZ by Shijiriju</div><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#e9dfd1;margin-top:4px">New Order Confirmed</div></td></tr>
 <tr><td style="padding:24px 28px">
  <p style="margin:0 0 4px;font-size:13px;color:#756a61">Order ID</p>
  <p style="margin:0 0 4px;font:600 24px Georgia,serif;color:#334c3d">#${esc(o.orderId)}</p>
  <p style="margin:0;font-size:13px;color:#756a61">${esc(orderDateIST(o.createdAt))}</p>
  ${h('Customer details')}
  <p style="margin:0;font-size:14px;line-height:1.6;color:#222">${esc(o.shippingName)}<br>Phone: ${esc(o.shippingPhone)}<br>Email: ${esc(o.shippingEmail)}</p>
  ${h('Order details')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
   <tr style="background:#faf9f6"><th align="left" style="padding:8px;font-size:12px;color:#756a61">Product</th><th style="padding:8px;font-size:12px;color:#756a61">Qty</th><th align="right" style="padding:8px;font-size:12px;color:#756a61">Unit price</th><th align="right" style="padding:8px;font-size:12px;color:#756a61">Subtotal</th></tr>${rows}
  </table>
  ${h('Payment details')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
   ${kv('Payment method', esc(paymentMethodLabel(o.paymentMethod)))}${kv('Payment status', esc(paymentStatusLabel(o)))}
   ${kv('Subtotal', money(o.subtotal))}${kv('Shipping', money(o.shippingCharge))}${kv('Discount' + (o.couponCode ? ` (${o.couponCode})` : ''), '− ' + money(o.discount))}
   <tr><td colspan="2" style="border-top:1px solid #ddd3c7;padding-top:6px"></td></tr>${kv('Final total', money(o.total), true)}
  </table>
  ${h('Delivery address')}
  <p style="margin:0;font-size:14px;line-height:1.6;color:#222">${esc(o.shippingName)}<br>${esc(o.shippingAddressLine)}<br>${esc(o.shippingCity)}, ${esc(o.shippingState)} – ${esc(o.shippingPincode)}${o.shippingCountry ? `<br>${esc(o.shippingCountry)}` : ''}</p>
 </td></tr>
 <tr><td style="background:#faf9f6;padding:14px 28px;font-size:12px;color:#756a61;border-top:1px solid #ddd3c7">Automated admin notification from RIZ by Shijiriju.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `NEW ORDER CONFIRMED - #${o.orderId}`, orderDateIST(o.createdAt), '',
    'CUSTOMER', `Name: ${o.shippingName}`, `Phone: ${o.shippingPhone}`, `Email: ${o.shippingEmail}`, '',
    'ITEMS', ...o.items.map((i) => `- ${i.name} [${variantLabel(i)}] Qty ${i.quantity} x ${money(i.price)} = ${money(i.price * i.quantity)}`), '',
    'PAYMENT', `Method: ${paymentMethodLabel(o.paymentMethod)}`, `Status: ${paymentStatusLabel(o)}`,
    `Subtotal: ${money(o.subtotal)}`, `Shipping: ${money(o.shippingCharge)}`, `Discount: ${money(o.discount)}`, `Final total: ${money(o.total)}`, '',
    'DELIVERY', fullAddress(o),
  ].join('\n');
  return { subject, html, text };
}

// ---- Wholesale Enquiry Formatting ------------------------------------------
export interface NotifyWholesaleEnquiry {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  location: string;
  estimatedQuantity: number;
  message?: string | null;
  status: string;
  createdAt: Date | string;
}

/** Parameter order matches {{1}}..{{9}} of the approved wholesale enquiry template. */
export function buildWholesaleWhatsAppParams(e: NotifyWholesaleEnquiry): string[] {
  return [
    e.id,
    orderDateIST(e.createdAt),
    e.fullName,
    e.businessName,
    e.whatsappNumber,
    e.email,
    e.location,
    String(e.estimatedQuantity || 0) + ' pcs',
    e.message || 'None provided',
  ].map((v) => waParam(v));
}

export function buildWholesaleEmail(e: NotifyWholesaleEnquiry): { subject: string; html: string; text: string } {
  const subject = `New Wholesale Enquiry – ${e.businessName || e.fullName}`;
  const kv = (k: string, v: string, bold = false) => `<tr><td style="padding:6px 0;color:#756a61;font-size:14px;width:150px">${esc(k)}</td><td style="padding:6px 0;font-size:14px;${bold ? 'font-weight:700;color:#334c3d' : 'color:#222'}">${v}</td></tr>`;
  const cleanPhone = (e.whatsappNumber || '').replace(/\D/g, '');
  const waChatLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f3ed;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ed"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #ddd3c7">
 <tr><td style="background:#334c3d;padding:22px 28px;color:#ffffff"><div style="font:600 22px Georgia,serif;letter-spacing:.04em">RIZ by Shijiriju</div><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#e9dfd1;margin-top:4px">New Wholesale Enquiry</div></td></tr>
 <tr><td style="padding:24px 28px">
  <p style="margin:0 0 4px;font-size:13px;color:#756a61">Enquiry Reference</p>
  <p style="margin:0 0 4px;font:600 20px Georgia,serif;color:#334c3d">#${esc(e.id)}</p>
  <p style="margin:0;font-size:13px;color:#756a61">${esc(orderDateIST(e.createdAt))}</p>
  
  <h3 style="margin:26px 0 8px;font:600 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a9895b">Enquiry Details</h3>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
   ${kv('Contact Person', esc(e.fullName))}
   ${kv('Business / Store', esc(e.businessName), true)}
   ${kv('Email', `<a href="mailto:${esc(e.email)}" style="color:#a9895b">${esc(e.email)}</a>`)}
   ${kv('WhatsApp', waChatLink ? `<a href="${esc(waChatLink)}" style="color:#a9895b" target="_blank">${esc(e.whatsappNumber)}</a>` : esc(e.whatsappNumber))}
   ${kv('Location', esc(e.location))}
   ${kv('Estimated Quantity', esc(String(e.estimatedQuantity)) + ' pieces', true)}
  </table>

  <h3 style="margin:24px 0 8px;font:600 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a9895b">Customer Message</h3>
  <div style="background:#faf9f6;border:1px solid #eee;padding:14px;border-radius:4px;font-size:14px;line-height:1.6;color:#333;white-space:pre-wrap">${esc(e.message || 'No additional message provided.')}</div>

  ${waChatLink ? `
  <div style="margin-top:24px;text-align:center">
    <a href="${esc(waChatLink)}" style="display:inline-block;background:#334c3d;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:.05em" target="_blank">Chat with Buyer on WhatsApp</a>
  </div>` : ''}
 </td></tr>
 <tr><td style="background:#faf9f6;padding:14px 28px;font-size:12px;color:#756a61;border-top:1px solid #ddd3c7">Automated admin notification from RIZ by Shijiriju. Manage in your Admin Dashboard.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `NEW WHOLESALE ENQUIRY - #${e.id}`,
    orderDateIST(e.createdAt),
    '',
    'BUYER INFORMATION',
    `Name: ${e.fullName}`,
    `Business: ${e.businessName}`,
    `Email: ${e.email}`,
    `WhatsApp: ${e.whatsappNumber}`,
    `Location: ${e.location}`,
    `Estimated Quantity: ${e.estimatedQuantity} pieces`,
    '',
    'MESSAGE',
    e.message || 'No message provided',
  ].join('\n');

  return { subject, html, text };
}
