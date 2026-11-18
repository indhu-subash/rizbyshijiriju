import { NotificationError, fetchWithTimeout, getEmailConfig, getWhatsAppConfig, redactSecrets } from './config';
import {
  NotifyOrder,
  NotifyWholesaleEnquiry,
  buildEmail,
  buildWhatsAppParams,
  buildWholesaleEmail,
  buildWholesaleWhatsAppParams,
} from './formatters';

export interface SendResult { messageId: string | null }

// Meta error codes that are transient (rate limits / temporary server problems)
const WA_RETRIABLE_CODES = new Set([1, 2, 4, 80007, 130429, 131000, 131056]);

/** Sends the approved template message to the admin via the official Meta WhatsApp Cloud API. */
export async function sendAdminWhatsApp(order: NotifyOrder): Promise<SendResult> {
  const c = getWhatsAppConfig();
  if (!c.ok) throw new NotificationError(`WhatsApp not configured (missing: ${c.missing.join(', ')})`, false, 'not_configured');
  const { cfg } = c;
  const res = await fetchWithTimeout(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cfg.to,
      type: 'template',
      template: { name: cfg.templateName, language: { code: cfg.language }, components: [{ type: 'body', parameters: buildWhatsAppParams(order).map((text) => ({ type: 'text', text })) }] },
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json?.error?.code;
    const detail = json?.error?.error_data?.details;
    const retriable = res.status === 429 || res.status >= 500 || WA_RETRIABLE_CODES.has(code);
    throw new NotificationError(redactSecrets(`WhatsApp API ${res.status}${code ? ` (code ${code})` : ''}: ${json?.error?.message || res.statusText}${detail ? ` - ${detail}` : ''}`), retriable, String(code || res.status));
  }
  return { messageId: json?.messages?.[0]?.id || null };
}

/** Sends the wholesale enquiry notification to the admin via the official Meta WhatsApp Cloud API. */
export async function sendAdminWholesaleWhatsApp(enquiry: NotifyWholesaleEnquiry): Promise<SendResult> {
  const c = getWhatsAppConfig();
  if (!c.ok) throw new NotificationError(`WhatsApp not configured (missing: ${c.missing.join(', ')})`, false, 'not_configured');
  const { cfg } = c;
  const res = await fetchWithTimeout(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cfg.to,
      type: 'template',
      template: {
        name: cfg.wholesaleTemplateName,
        language: { code: cfg.language },
        components: [{ type: 'body', parameters: buildWholesaleWhatsAppParams(enquiry).map((text) => ({ type: 'text', text })) }],
      },
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json?.error?.code;
    const detail = json?.error?.error_data?.details;
    const retriable = res.status === 429 || res.status >= 500 || WA_RETRIABLE_CODES.has(code);
    throw new NotificationError(redactSecrets(`WhatsApp API ${res.status}${code ? ` (code ${code})` : ''}: ${json?.error?.message || res.statusText}${detail ? ` - ${detail}` : ''}`), retriable, String(code || res.status));
  }
  return { messageId: json?.messages?.[0]?.id || null };
}

/** Sends the admin order email through Resend's REST API (idempotency key prevents provider-side duplicates). */
export async function sendAdminEmail(order: NotifyOrder): Promise<SendResult> {
  const c = getEmailConfig();
  if (!c.ok) throw new NotificationError(`Email not configured (missing: ${c.missing.join(', ')})`, false, 'not_configured');
  const { cfg } = c;
  const { subject, html, text } = buildEmail(order);
  const res = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `admin-order-confirmed-${order.id}` },
    body: JSON.stringify({ from: cfg.from, to: cfg.to, subject, html, text }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const retriable = res.status === 429 || res.status >= 500;
    throw new NotificationError(redactSecrets(`Resend API ${res.status}: ${json?.message || json?.name || res.statusText}`), retriable, String(res.status));
  }
  return { messageId: json?.id || null };
}

/** Sends the wholesale enquiry email through Resend's REST API. */
export async function sendAdminWholesaleEmail(enquiry: NotifyWholesaleEnquiry): Promise<SendResult> {
  const c = getEmailConfig();
  if (!c.ok) throw new NotificationError(`Email not configured (missing: ${c.missing.join(', ')})`, false, 'not_configured');
  const { cfg } = c;
  const { subject, html, text } = buildWholesaleEmail(enquiry);
  const res = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `admin-wholesale-enquiry-${enquiry.id}` },
    body: JSON.stringify({ from: cfg.from, to: cfg.to, subject, html, text }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const retriable = res.status === 429 || res.status >= 500;
    throw new NotificationError(redactSecrets(`Resend API ${res.status}: ${json?.message || json?.name || res.statusText}`), retriable, String(res.status));
  }
  return { messageId: json?.id || null };
}

