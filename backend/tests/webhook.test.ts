/* Razorpay webhook security + end-to-end confirmation -> admin notification tests. */
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';

const SECRET = 'whsec_test_123';
Object.assign(process.env, { RAZORPAY_WEBHOOK_SECRET: SECRET, PAYMENT_MODE: 'razorpay',
  WHATSAPP_ACCESS_TOKEN: 'tok_wa_123456', WHATSAPP_PHONE_NUMBER_ID: '1', WHATSAPP_API_VERSION: 'v23.0', ADMIN_WHATSAPP_NUMBER: '919876543210',
  RESEND_API_KEY: 're_key_123456', ADMIN_EMAIL: 'a@riz.test', EMAIL_FROM: 'RIZ <o@riz.test>' });

const orders: Record<string, any> = {}; const notifs: any[] = []; let nid = 0;
const base = (id: string, over: any = {}) => (orders[id] = { id, orderId: 'RIZ-2026-' + id, razorpayOrderId: 'order_' + id, paymentId: null, orderStatus: 'Pending', paymentStatus: 'pending', paymentMethod: 'upi',
  subtotal: 500, discount: 0, shippingCharge: 50, total: 550, shippingName: 'A', shippingPhone: '+911', shippingEmail: 'a@x.com', shippingAddressLine: 'L', shippingCity: 'C', shippingState: 'S', shippingPincode: '1', createdAt: new Date(),
  items: [{ name: 'Ring', price: 500, quantity: 1, color: null, size: '7' }], ...over });
function match(row: any, w: any): boolean { return Object.entries(w || {}).every(([k, v]: [string, any]) => k === 'OR' ? v.some((x: any) => match(row, x)) : k === 'AND' ? v.every((x: any) => match(row, x)) : v === null ? row[k] == null : v && typeof v === 'object' && !(v instanceof Date) ? ('lt' in v ? row[k] != null && row[k] < v.lt : 'lte' in v ? row[k] != null && row[k] <= v.lte : true) : row[k] === v); }
const apply = (n: any, d: any) => { for (const [k, v] of Object.entries<any>(d)) n[k] = v && typeof v === 'object' && 'increment' in v ? n[k] + v.increment : v; };
const fake: any = {
  order: {
    findFirst: async ({ where }: any) => Object.values(orders).find((o: any) => where.OR.some((c: any) => (c.razorpayOrderId && o.razorpayOrderId === c.razorpayOrderId) || (c.orderId && o.orderId === c.orderId))) || null,
    findUnique: async ({ where }: any) => (orders[where.id] ? { ...orders[where.id] } : null),
    updateMany: async ({ where, data }: any) => { const hit = Object.values(orders).filter((o: any) => match(o, where)); hit.forEach((o: any) => apply(o, data)); return { count: hit.length }; },
    update: async ({ where, data }: any) => { apply(orders[where.id], data); return orders[where.id]; },
  },
  orderNotification: {
    createMany: async ({ data }: any) => { for (const d of data) if (!notifs.find((n) => n.orderRef === d.orderRef && n.channel === d.channel)) notifs.push({ id: 'n' + ++nid, attempts: 0, lockedAt: null, ...d }); },
    findMany: async ({ where }: any) => notifs.filter((n) => match(n, where)).map((n) => ({ ...n })),
    findUnique: async ({ where }: any) => notifs.find((n) => n.id === where.id) || null,
    updateMany: async ({ where, data }: any) => { const h = notifs.filter((n) => match(n, where)); h.forEach((n) => apply(n, data)); return { count: h.length }; },
    update: async ({ where, data }: any) => { const n = notifs.find((x) => x.id === where.id); apply(n, data); return n; },
  },
};
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fake } } as any;

let out: string[] = [];
const realFetch = (globalThis as any).fetch;
(globalThis as any).fetch = async (url: string, init: any) => {
  if (/localhost|127\.0\.0\.1/.test(String(url))) return realFetch(url, init);
  out.push(String(url)); const wa = String(url).includes('facebook');
  return { ok: true, status: 200, statusText: 'OK', json: async () => (wa ? { messages: [{ id: 'wamid.1' }] } : { id: 'em_1' }) } as any;
};

const { captureWebhookRawBody } = require('../src/utils/webhookRawBody');
const { verifyRazorpayWebhookSignature } = require('../src/services/razorpayWebhook');
const paymentRoutes = require('../src/routes/paymentRoutes').default;
const app = express();
app.use(express.json({ limit: '50mb', verify: captureWebhookRawBody })); // identical to server.ts
app.use('/api/payments', paymentRoutes);

const sign = (body: string, secret = SECRET) => crypto.createHmac('sha256', secret).update(body).digest('hex');
const evt = (event: string, id: string) => JSON.stringify({ event, payload: { payment: { entity: { id: 'pay_' + id, order_id: 'order_' + id } } } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let passed = 0; const ok = (m: string) => { passed++; console.log('PASS ' + m); };

async function main() {
  const server = http.createServer(app); await new Promise<void>((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${(server.address() as any).port}/api/payments/webhook`;
  const post = (body: string, sig?: string, ct = 'application/json') => fetch(url, { method: 'POST', headers: { 'Content-Type': ct, ...(sig ? { 'x-razorpay-signature': sig } : {}) }, body });
  const notifCount = (id: string) => notifs.filter((n) => n.orderRef === id).length;

  // unit: signature verifier
  assert.equal(verifyRazorpayWebhookSignature('x', sign('x'), SECRET), true);
  assert.equal(verifyRazorpayWebhookSignature('x', sign('y'), SECRET), false);
  assert.equal(verifyRazorpayWebhookSignature('x', 'short', SECRET), false);
  assert.equal(verifyRazorpayWebhookSignature('x', sign('x'), ''), false);
  assert.equal(verifyRazorpayWebhookSignature('x', undefined, SECRET), false);
  assert.equal(verifyRazorpayWebhookSignature(undefined, sign('x'), SECRET), false);
  ok('signature verifier: accepts only exact HMAC; rejects empty/short/missing inputs');

  // A. forged / unsigned events never confirm
  base('A'); const bodyA = evt('payment.captured', 'A');
  let r = await post(bodyA); assert.equal(r.status, 400);
  r = await post(bodyA, sign(bodyA, 'attacker_secret')); assert.equal(r.status, 400);
  r = await post(bodyA, 'a'.repeat(64)); assert.equal(r.status, 400);
  r = await post(bodyA, sign(evt('payment.captured', 'OTHER'))); assert.equal(r.status, 400, 'signature of a different body');
  assert.equal(orders.A.orderStatus, 'Pending'); assert.equal(notifCount('A'), 0); assert.equal(out.length, 0);
  ok('missing / forged / wrong-body signatures -> 400, order untouched, no notifications');

  // B. non-JSON content type => no raw body => rejected
  r = await post(bodyA, sign(bodyA), 'text/plain'); assert.equal(r.status, 400); assert.equal(orders.A.orderStatus, 'Pending');
  ok('request without captured raw body -> rejected');

  // C. signature must be over the ORIGINAL bytes (whitespace-different JSON)
  const pretty = JSON.stringify(JSON.parse(bodyA), null, 4);
  r = await post(pretty, sign(bodyA)); assert.equal(r.status, 400, 'signature of re-serialised JSON must NOT verify');
  assert.equal(orders.A.orderStatus, 'Pending');
  r = await post(pretty, sign(pretty)); assert.equal(r.status, 200, 'signature of the original raw bytes verifies');
  await sleep(60);
  assert.equal(orders.A.orderStatus, 'Confirmed'); assert.equal(orders.A.paymentStatus, 'paid'); assert.equal(orders.A.paymentId, 'pay_A');
  ok('verification uses ORIGINAL raw bytes (pretty-printed body verified, re-serialised signature rejected)');

  // D. confirmed -> admin notified once
  assert.equal(notifCount('A'), 2); assert.ok(notifs.filter((n) => n.orderRef === 'A').every((n) => n.status === 'sent'));
  assert.equal(out.filter((u) => u.includes('facebook')).length, 1); assert.equal(out.filter((u) => u.includes('resend')).length, 1);
  ok('verified webhook confirms order and sends exactly one WhatsApp + one email');

  // E. duplicate deliveries of the same webhook
  for (let i = 0; i < 3; i++) assert.equal((await post(pretty, sign(pretty))).status, 200);
  await sleep(60); assert.equal(notifCount('A'), 2); assert.equal(out.length, 2);
  ok('duplicate webhook deliveries -> no duplicate notifications');

  // F. payment.failed / cancelled orders never notify
  out = []; base('F'); const bf = evt('payment.failed', 'F'); assert.equal((await post(bf, sign(bf))).status, 200);
  base('G', { orderStatus: 'Cancelled' }); const bg = evt('payment.captured', 'G'); assert.equal((await post(bg, sign(bg))).status, 200); await sleep(60);
  assert.equal(orders.F.orderStatus, 'Pending'); assert.equal(orders.G.orderStatus, 'Cancelled'); assert.equal(notifCount('F') + notifCount('G'), 0); assert.equal(out.length, 0);
  ok('failed-payment event and cancelled order -> no confirmation, no notification');

  // G. secret not configured => reject everything, even a "valid-looking" signature
  delete process.env.RAZORPAY_WEBHOOK_SECRET; base('H'); const bh = evt('payment.captured', 'H');
  r = await post(bh, sign(bh, '')); assert.equal(r.status, 503); r = await post(bh); assert.equal(r.status, 503);
  assert.equal(orders.H.orderStatus, 'Pending'); assert.equal(notifCount('H'), 0);
  ok('RAZORPAY_WEBHOOK_SECRET unset -> 503, payments can NOT be confirmed via webhook');

  server.close(); console.log(`\nwebhook tests: ALL ${passed} PASSED`); process.exit(0);
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
