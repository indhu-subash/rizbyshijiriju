import * as crypto from 'crypto';

/**
 * Verifies a Razorpay webhook signature: HMAC-SHA256 (hex) of the ORIGINAL raw request body,
 * keyed with the webhook secret, compared in constant time.
 * Returns false (never throws) for any missing/malformed input.
 */
export function verifyRazorpayWebhookSignature(rawBody: Buffer | string | undefined | null, signature: unknown, secret: string | undefined): boolean {
  if (!secret || !rawBody || typeof signature !== 'string' || !/^[0-9a-fA-F]{64}$/.test(signature.trim())) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const given = Buffer.from(signature.trim(), 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}
