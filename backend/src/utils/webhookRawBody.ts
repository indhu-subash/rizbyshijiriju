/** Used as the `verify` hook of express.json(): keeps the exact bytes of Razorpay webhook requests (and only those). */
export function captureWebhookRawBody(req: any, _res: unknown, buf: Buffer): void {
  const path = typeof req.originalUrl === 'string' ? req.originalUrl.split('?')[0].replace(/\/+$/, '') : '';
  if (path === '/api/payments/webhook') req.rawBody = buf;
}
