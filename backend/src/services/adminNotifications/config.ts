// Reads admin-notification configuration from the environment. Never logs secret values.
export class NotificationError extends Error {
  constructor(message: string, public retriable: boolean, public code?: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  to: string;
  templateName: string;
  wholesaleTemplateName: string;
  language: string;
}
export interface EmailConfig { apiKey: string; from: string; to: string[] }

export function getWhatsAppConfig(): { ok: true; cfg: WhatsAppConfig } | { ok: false; missing: string[] } {
  const e = process.env;
  const to = (e.ADMIN_WHATSAPP_NUMBER || '919072308686').replace(/\D/g, '');
  const missing = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_API_VERSION'].filter((k) => !(e[k] || '').trim());
  if (!to || to.length < 8 || to.length > 15) missing.push('ADMIN_WHATSAPP_NUMBER (invalid format)');
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    cfg: {
      accessToken: e.WHATSAPP_ACCESS_TOKEN!.trim(),
      phoneNumberId: e.WHATSAPP_PHONE_NUMBER_ID!.trim(),
      apiVersion: e.WHATSAPP_API_VERSION!.trim(),
      to,
      templateName: (e.WHATSAPP_ORDER_TEMPLATE_NAME || 'riz_admin_new_order').trim(),
      wholesaleTemplateName: (e.WHATSAPP_WHOLESALE_TEMPLATE_NAME || 'riz_admin_new_wholesale_enquiry').trim(),
      language: (e.WHATSAPP_TEMPLATE_LANGUAGE || 'en').trim(),
    },
  };
}

export function getEmailConfig(): { ok: true; cfg: EmailConfig } | { ok: false; missing: string[] } {
  const e = process.env;
  // EMAIL_FROM is the documented sender. RESEND_EMAIL_FROM is an optional override for setups where the existing
  // SMTP code already uses EMAIL_FROM for something else (it must be an address on a Resend-verified domain).
  const from = (e.RESEND_EMAIL_FROM || e.EMAIL_FROM || '').trim();
  const missing = ['RESEND_API_KEY', 'ADMIN_EMAIL'].filter((k) => !(e[k] || '').trim());
  if (!from) missing.push('EMAIL_FROM');
  if (missing.length) return { ok: false, missing };
  const to = e.ADMIN_EMAIL!.split(',').map((s) => s.trim()).filter(Boolean);
  return { ok: true, cfg: { apiKey: e.RESEND_API_KEY!.trim(), from, to } };
}

/** Logs only WHICH variables are missing - never values. Called once at startup; never throws. */
export function logNotificationConfigStatus(): void {
  const wa = getWhatsAppConfig();
  const em = getEmailConfig();
  console.log(`[AdminNotify] WhatsApp: ${wa.ok ? 'configured' : 'NOT configured (missing: ' + wa.missing.join(', ') + ')'}`);
  console.log(`[AdminNotify] Email (Resend): ${em.ok ? 'configured' : 'NOT configured (missing: ' + em.missing.join(', ') + ')'}`);
}

/** Removes any configured secret from text before it is stored or logged. */
export function redactSecrets(text: string): string {
  let out = text;
  for (const k of ['WHATSAPP_ACCESS_TOKEN', 'RESEND_API_KEY']) {
    const v = (process.env[k] || '').trim();
    if (v.length >= 6) out = out.split(v).join('[redacted]');
  }
  return out.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [redacted]');
}

export async function fetchWithTimeout(url: string, init: RequestInit, ms = 10000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch (err: any) {
    throw new NotificationError(err?.name === 'AbortError' ? `Request timed out after ${ms}ms` : `Network error: ${err?.message || err}`, true, 'network');
  } finally {
    clearTimeout(t);
  }
}
