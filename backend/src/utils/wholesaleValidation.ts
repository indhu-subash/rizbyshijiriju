// Pure helpers (no database / framework imports) so they can be unit-tested in isolation.

export const WHOLESALE_STATUSES = ['pending', 'contacted', 'approved', 'rejected'] as const;
export type WholesaleStatus = (typeof WHOLESALE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Sanitisation / validation helpers (pure - exported for tests)
// ---------------------------------------------------------------------------

/** Strips control characters and HTML tags, collapses whitespace, enforces max length. */
export function sanitizeText(value: unknown, maxLength: number, keepNewlines = false): string {
  if (typeof value !== 'string') return '';
  let out = value
    // eslint-disable-next-line no-control-regex
    .replace(keepNewlines ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '');
  out = keepNewlines
    ? out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    : out.replace(/\s+/g, ' ');
  return out.trim().slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface ValidatedEnquiry {
  fullName: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  location: string;
  estimatedQuantity: number;
  message: string | null;
}

export function validateEnquiryInput(body: any): { data?: ValidatedEnquiry; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fullName = sanitizeText(body?.fullName, 100);
  const businessName = sanitizeText(body?.businessName, 150);
  const email = sanitizeText(body?.email, 254).toLowerCase();
  const location = sanitizeText(body?.location, 150);
  const message = sanitizeText(body?.message, 2000, true);

  // WhatsApp: keep digits and an optional leading +, allow common separators.
  const rawWa = typeof body?.whatsappNumber === 'string' ? body.whatsappNumber.trim().slice(0, 30) : '';
  const waDigits = rawWa.replace(/[\s\-().]/g, '');
  const whatsappNumber = waDigits;

  const qtyRaw = typeof body?.estimatedQuantity === 'string' ? body.estimatedQuantity.trim() : body?.estimatedQuantity;
  const qty = typeof qtyRaw === 'number' ? qtyRaw : /^\d{1,7}$/.test(String(qtyRaw ?? '')) ? Number(qtyRaw) : NaN;

  if (fullName.length < 2) errors.fullName = 'Please enter your full name.';
  if (businessName.length < 2) errors.businessName = 'Please enter your business or store name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (!/^\+?\d{8,15}$/.test(whatsappNumber)) errors.whatsappNumber = 'Please enter a valid WhatsApp number with country code.';
  if (location.length < 2) errors.location = 'Please enter your location.';
  if (!Number.isInteger(qty) || qty < 1 || qty > 1_000_000) errors.estimatedQuantity = 'Please enter an estimated quantity between 1 and 1,000,000.';
  if (message.length > 0 && message.length < 3) errors.message = 'Message is too short.';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: { fullName, businessName, email, whatsappNumber, location, estimatedQuantity: qty, message: message || null },
  };
}
