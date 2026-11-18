/* Admin notification tests: real queue/clients/formatters + in-memory fake Prisma + mocked fetch. */
import assert from 'node:assert/strict';

// ---- env (fake secrets, used to prove they never leak) ----
const SECRET_WA = 'EAAG_super_secret_token_123456';
const SECRET_RS = 're_super_secret_key_abcdef';
Object.assign(process.env, {
  WHATSAPP_ACCESS_TOKEN: SECRET_WA, WHATSAPP_PHONE_NUMBER_ID: '555000111', WHATSAPP_API_VERSION: 'v23.0', ADMIN_WHATSAPP_NUMBER: '+91 98765 43210',
  RESEND_API_KEY: SECRET_RS, ADMIN_EMAIL: 'admin@riz.test', EMAIL_FROM: 'RIZ Orders <orders@riz.test>',
});

// ---- fake prisma ----
const notifs: any[] = []; const orders: Record<string, any> = {}; let nid = 0; let failDb = false;
function match(row: any, w: any): boolean {
  return Object.entries(w || {}).every(([k, v]: [string, any]) => {
    if (k === 'OR') return v.some((x: any) => match(row, x));
    if (k === 'AND') return v.every((x: any) => match(row, x));
    const val = row[k];
    if (v === null) return val === null || val === undefined;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      if ('lt' in v) return val != null && val < v.lt;
      if ('lte' in v) return val != null && val <= v.lte;
      if ('in' in v) return v.in.includes(val);
    }
    return val === v;
  });
}
const fake: any = {
  order: { findUnique: async ({ where }: any) => orders[where.id] || null },
  orderNotification: {
    createMany: async ({ data }: any) => {
      if (failDb) throw new Error('relation "OrderNotification" does not exist');
      for (const d of data) if (!notifs.find((n) => n.orderRef === d.orderRef && n.channel === d.channel)) notifs.push({ id: 'n' + ++nid, attempts: 0, lockedAt: null, sentAt: null, providerMessageId: null, lastError: null, lastAttemptAt: null, createdAt: new Date(), ...d });
    },
    findMany: async ({ where, take }: any) => notifs.filter((n) => match(n, where)).slice(0, take || 999).map((n) => ({ ...n })), // copies, like real Prisma
    findUnique: async ({ where }: any) => notifs.find((n) => n.id === where.id) || null,
    updateMany: async ({ where, data }: any) => { const hit = notifs.filter((n) => match(n, where)); hit.forEach((n) => apply(n, data)); return { count: hit.length }; },
    update: async ({ where, data }: any) => { const n = notifs.find((x) => x.id === where.id)!; apply(n, data); return n; },
  },
};
function apply(n: any, data: any) { for (const [k, v] of Object.entries<any>(data)) n[k] = v && typeof v === 'object' && 'increment' in v ? n[k] + v.increment : v; }
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fake } } as any;

// ---- fetch mock ----
type Call = { url: string; headers: any; body: any };
let calls: Call[] = []; let waStatus = 200; let emailStatus = 200;
(globalThis as any).fetch = async (url: string, init: any) => {
  const body = JSON.parse(init.body); calls.push({ url, headers: init.headers, body });
  const isWa = url.includes('graph.facebook.com');
  const status = isWa ? waStatus : emailStatus;
  const ok = status < 300;
  const json = isWa ? (ok ? { messages: [{ id: 'wamid.ABC123' }] } : { error: { code: status === 400 ? 132001 : 131056, message: `boom ${SECRET_WA}`, error_data: { details: 'tpl' } } }) : ok ? { id: 're_msg_1' } : { message: `bad ${SECRET_RS}` };
  return { ok, status, statusText: 'x', json: async () => json } as any;
};
const waCalls = () => calls.filter((c) => c.url.includes('graph.facebook.com'));
const mailCalls = () => calls.filter((c) => c.url.includes('api.resend.com'));

const q = require('../src/services/adminNotifications/queue');
const f = require('../src/services/adminNotifications/formatters');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
function mkOrder(over: any = {}) {
  const id = 'ord' + ++seq;
  orders[id] = { id, orderId: `RIZ-2026-1000${seq}`, subtotal: 1998, discount: 100, shippingCharge: 60, total: 1958, paymentMethod: 'upi', paymentStatus: 'paid', orderStatus: 'Confirmed',
    shippingName: 'Asha <script>x</script> Nair', shippingPhone: '+919876543210', shippingEmail: 'asha@example.com', shippingAddressLine: '12 MG Road\nNear Park', shippingCity: 'Kochi', shippingState: 'Kerala', shippingPincode: '682001', shippingCountry: 'India',
    createdAt: new Date('2026-11-17T10:15:00Z'), items: [{ name: 'Pearl Drop Earrings', price: 999, quantity: 2, color: 'Gold', size: 'Free', productCode: 'RZ-01' }], ...over };
  return orders[id];
}
const rowsFor = (o: any) => notifs.filter((n) => n.orderRef === o.id);
const reset = () => { calls = []; waStatus = 200; emailStatus = 200; };
let passed = 0; const ok = (name: string) => { passed++; console.log('PASS ' + name); };

async function main() {
  // 1. Razorpay paid order -> both channels sent, once
  let o = mkOrder();
  await q.notifyOrderConfirmed(o); await sleep(40);
  assert.deepEqual(rowsFor(o).map((n) => [n.channel, n.status]).sort(), [['email', 'sent'], ['whatsapp', 'sent']]);
  assert.equal(waCalls().length, 1); assert.equal(mailCalls().length, 1);
  ok('confirmed paid order -> WhatsApp + email both sent');

  // payload checks
  const wa = waCalls()[0];
  assert.equal(wa.url, 'https://graph.facebook.com/v23.0/555000111/messages');
  assert.equal(wa.body.to, '919876543210'); assert.equal(wa.body.type, 'template');
  assert.equal(wa.body.template.name, 'riz_admin_new_order'); assert.equal(wa.body.template.language.code, 'en');
  const params = wa.body.template.components[0].parameters.map((p: any) => p.text);
  assert.equal(params.length, 16); assert.ok(params.every((t: string) => t.length > 0 && !/[\n\t]/.test(t)), 'no empty/newline params');
  assert.equal(params[0], o.orderId); assert.equal(params[11], '₹1,958'); assert.equal(params[9], '₹60'); assert.equal(params[10], '₹100');
  assert.ok(params[5].includes('Pearl Drop Earrings') && params[5].includes('Qty 2') && params[5].includes('₹999') && params[5].includes('₹1,998'));
  assert.equal(params[12], '12 MG Road Near Park'); assert.ok(params[1].endsWith('IST'));
  assert.equal(wa.headers.Authorization, `Bearer ${SECRET_WA}`);
  ok('WhatsApp payload: 16 valid params, correct number/template/auth');
  const mail = mailCalls()[0];
  assert.equal(mail.body.subject, `New Order Confirmed – Order #${o.orderId}`); assert.deepEqual(mail.body.to, ['admin@riz.test']);
  assert.equal(mail.headers['Idempotency-Key'], `admin-order-confirmed-${o.id}`);
  assert.ok(!mail.body.html.includes('<script>x') && mail.body.html.includes('&lt;script&gt;'), 'HTML escaped');
  for (const s of ['Pearl Drop Earrings', 'Colour: Gold', '₹1,958', '₹60', 'Kochi', '682001', 'asha@example.com', '+919876543210', 'UPI (Razorpay)', 'Paid']) assert.ok(mail.body.html.includes(s), 'email has ' + s);
  ok('email: subject, escaping, all required fields, idempotency key');

  // 2. duplicate trigger (webhook + verify both fire) -> no extra sends
  await q.notifyOrderConfirmed(o); await q.notifyOrderConfirmed(o); await sleep(40);
  assert.equal(rowsFor(o).length, 2); assert.equal(waCalls().length, 1); assert.equal(mailCalls().length, 1);
  ok('duplicate webhook/verify triggers -> no duplicate rows or messages');

  // 3. concurrency: same row processed simultaneously -> single send
  reset(); o = mkOrder();
  await fake.orderNotification.createMany({ data: ['whatsapp', 'email'].map((channel) => ({ orderRef: o.id, orderNumber: o.orderId, channel, status: 'pending' })) });
  const row = rowsFor(o).find((n) => n.channel === 'email');
  const outcomes = await Promise.all([q.processNotification({ ...row }), q.processNotification({ ...row }), q.processNotification({ ...row })]);
  assert.equal(outcomes.filter((x: string) => x === 'sent').length, 1); assert.equal(mailCalls().length, 1);
  await q.processOrderNotifications(o.id); // drain the other channel left pending by this test
  ok('concurrent workers on same row -> exactly one send');

  // 4. WhatsApp fails permanently -> email still sent
  reset(); waStatus = 400; o = mkOrder();
  await q.notifyOrderConfirmed(o); await sleep(40);
  let r = Object.fromEntries(rowsFor(o).map((n) => [n.channel, n]));
  assert.equal(r.whatsapp.status, 'failed'); assert.equal(r.email.status, 'sent'); assert.equal(orders[o.id].orderStatus, 'Confirmed');
  assert.ok(r.whatsapp.lastError.includes('132001')); assert.ok(!r.whatsapp.lastError.includes(SECRET_WA), 'token redacted from stored error');
  ok('WhatsApp failure does not stop email; order stays Confirmed; token redacted');

  // 5. Email fails transiently -> WhatsApp sent; email retried with backoff, then fails after MAX attempts
  reset(); emailStatus = 500; o = mkOrder();
  await q.notifyOrderConfirmed(o); await sleep(40);
  r = Object.fromEntries(rowsFor(o).map((n) => [n.channel, n]));
  assert.equal(r.whatsapp.status, 'sent'); assert.equal(r.email.status, 'pending'); assert.equal(r.email.attempts, 1); assert.ok(r.email.nextAttemptAt > new Date());
  assert.ok(!r.email.lastError.includes(SECRET_RS));
  const mailBefore = mailCalls().length; await q.processDueNotifications();
  assert.equal(mailCalls().length, mailBefore, 'not retried before backoff elapses');
  for (let i = 2; i <= q.MAX_ATTEMPTS; i++) { r.email.nextAttemptAt = new Date(Date.now() - 1000); await q.processDueNotifications(); }
  assert.equal(r.email.status, 'failed'); assert.equal(r.email.attempts, q.MAX_ATTEMPTS); assert.equal(waCalls().length, 1, 'WhatsApp never resent');
  ok('email failure does not stop WhatsApp; transient errors back off then fail after max attempts');

  // 6. manual retry: failed -> sent; already-sent can never be retried/resent
  emailStatus = 200; const before = calls.length;
  assert.equal(await q.retryNotification(r.email.id), 'requeued'); await sleep(40);
  assert.equal(r.email.status, 'sent'); assert.equal(mailCalls().filter((c) => c.headers['Idempotency-Key'].includes(o.id)).length, q.MAX_ATTEMPTS + 1);
  const afterRetry = calls.length;
  assert.equal(await q.retryNotification(r.email.id), 'not_failed'); assert.equal(await q.retryNotification(r.whatsapp.id), 'not_failed'); assert.equal(await q.retryNotification('nope'), 'not_found');
  await sleep(30); assert.equal(calls.length, afterRetry, 'retry on sent rows sends nothing');
  ok('manual retry re-sends only failed rows; sent rows are never resent');

  // 7. ineligible orders -> no messages
  for (const [label, over] of [['Pending order', { orderStatus: 'Pending', paymentStatus: 'pending' }], ['Cancelled order', { orderStatus: 'Cancelled' }], ['failed payment', { orderStatus: 'Pending', paymentStatus: 'failed' }], ['online unpaid but Confirmed', { paymentStatus: 'pending' }], ['Refunded', { orderStatus: 'Refunded' }]] as any) {
    reset(); o = mkOrder(over); await q.notifyOrderConfirmed(o); await sleep(40);
    assert.equal(calls.length, 0, label + ' must not notify'); assert.ok(rowsFor(o).every((n) => n.status === 'failed' && n.lastError.startsWith('Skipped')), label);
  }
  ok('pending / cancelled / failed-payment / unpaid-online / refunded -> NO notification');

  // 8. COD order (Confirmed, payment pending) -> notifies, labelled correctly
  reset(); o = mkOrder({ paymentMethod: 'cod', paymentStatus: 'pending', orderStatus: 'Confirmed' }); await q.notifyOrderConfirmed(o); await sleep(40);
  assert.equal(waCalls().length, 1); assert.equal(mailCalls().length, 1);
  assert.ok(mailCalls()[0].body.html.includes('Cash on Delivery (COD)') && mailCalls()[0].body.html.includes('Pending (collect on delivery)'));
  ok('COD confirmed order -> notifies with COD labels');

  // 9. not configured -> clean failure, no network, order untouched; retry works after configuring
  reset(); const saved = { ...process.env }; delete process.env.RESEND_API_KEY; delete process.env.WHATSAPP_ACCESS_TOKEN;
  o = mkOrder(); await q.notifyOrderConfirmed(o); await sleep(40);
  assert.equal(calls.length, 0); assert.ok(rowsFor(o).every((n) => n.status === 'failed' && /not configured/.test(n.lastError)));
  Object.assign(process.env, saved);
  for (const n of rowsFor(o)) await q.retryNotification(n.id); await sleep(40);
  assert.ok(rowsFor(o).every((n) => n.status === 'sent'));
  ok('missing config -> failed cleanly (no calls); sends after config + retry');

  // 10. DB failure while enqueuing never throws (order flow safe)
  failDb = true; await q.notifyOrderConfirmed(mkOrder()); failDb = false;
  ok('enqueue failure (e.g. table missing) is swallowed - cannot break checkout');

  // 11. network timeout/throw is treated as retriable
  reset(); const realFetch = (globalThis as any).fetch; (globalThis as any).fetch = async () => { throw Object.assign(new Error('socket hang up'), { name: 'Error' }); };
  o = mkOrder(); await q.notifyOrderConfirmed(o); await sleep(40);
  assert.ok(rowsFor(o).every((n) => n.status === 'pending' && n.attempts === 1)); (globalThis as any).fetch = realFetch;
  ok('network error -> stays pending for retry');

  // 12. long item list is truncated within Meta limits
  const many = Array.from({ length: 40 }, (_, i) => ({ name: 'Long Product Name Number ' + i, price: 1234.5, quantity: 3, color: 'Rose Gold', size: 'Adjustable' }));
  const p = f.buildWhatsAppParams(mkOrder({ items: many })); assert.ok(p[5].length <= 1024 && p[5].includes('more item(s)'));
  ok('long item list truncated safely for WhatsApp param limit');

  console.log(`\nnotification tests: ALL ${passed} PASSED`);
  process.exit(0);
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
