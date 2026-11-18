/* Admin Wholesale Notification tests: queue, delivery, failure isolation, deduplication and retry. */
import assert from 'node:assert/strict';

const SECRET_WA = 'EAAG_wholesale_secret_token_123456';
const SECRET_RS = 're_wholesale_secret_key_abcdef';
Object.assign(process.env, {
  WHATSAPP_ACCESS_TOKEN: SECRET_WA,
  WHATSAPP_PHONE_NUMBER_ID: '555000111',
  WHATSAPP_API_VERSION: 'v23.0',
  ADMIN_WHATSAPP_NUMBER: '+91 98765 43210',
  RESEND_API_KEY: SECRET_RS,
  ADMIN_EMAIL: 'admin@riz.test',
  EMAIL_FROM: 'RIZ Orders <orders@riz.test>',
  WHATSAPP_WHOLESALE_TEMPLATE_NAME: 'riz_admin_new_wholesale_enquiry',
});

// ---- in-memory fake prisma ----
const notifs: any[] = [];
const enquiries: Record<string, any> = {};
let nid = 0;
let failDb = false;

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
      if ('gte' in v) return val != null && val >= v.gte;
    }
    return val === v;
  });
}

function apply(n: any, data: any) {
  for (const [k, v] of Object.entries<any>(data)) {
    n[k] = v && typeof v === 'object' && 'increment' in v ? n[k] + v.increment : v;
  }
}

const fake: any = {
  wholesaleEnquiry: {
    findFirst: async ({ where }: any) => Object.values(enquiries).find((e: any) => match(e, where)) || null,
    findUnique: async ({ where }: any) => enquiries[where.id] || null,
    create: async ({ data }: any) => {
      const id = data.id || 'enq_' + ++nid;
      const row = { id, createdAt: new Date(), updatedAt: new Date(), status: 'pending', ...data };
      enquiries[id] = row;
      return row;
    },
    findMany: async ({ where, skip, take }: any) => Object.values(enquiries).filter((e: any) => match(e, where)).slice(skip || 0, (skip || 0) + (take || 999)),
    count: async ({ where }: any) => Object.values(enquiries).filter((e: any) => match(e, where)).length,
    groupBy: async () => [{ status: 'pending', _count: { _all: Object.values(enquiries).length } }],
  },
  wholesaleNotification: {
    createMany: async ({ data }: any) => {
      if (failDb) throw new Error('relation "WholesaleNotification" does not exist');
      for (const d of data) {
        if (!notifs.find((n) => n.enquiryRef === d.enquiryRef && n.channel === d.channel)) {
          notifs.push({
            id: 'wn_' + ++nid,
            attempts: 0,
            lockedAt: null,
            sentAt: null,
            providerMessageId: null,
            lastError: null,
            lastAttemptAt: null,
            createdAt: new Date(),
            ...d,
          });
        }
      }
    },
    findMany: async ({ where, take }: any) => notifs.filter((n) => match(n, where)).slice(0, take || 999).map((n) => ({ ...n })),
    findUnique: async ({ where }: any) => notifs.find((n) => n.id === where.id) || null,
    updateMany: async ({ where, data }: any) => {
      const hit = notifs.filter((n) => match(n, where));
      hit.forEach((n) => apply(n, data));
      return { count: hit.length };
    },
    update: async ({ where, data }: any) => {
      const n = notifs.find((x) => x.id === where.id)!;
      apply(n, data);
      return n;
    },
  },
};

const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fake } } as any;

// ---- fetch mock ----
let calls: { url: string; body: any; headers: any }[] = [];
let nextWaResponse: () => Promise<Response> = async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.ENQ123' }] }), { status: 200, statusText: 'OK' });
let nextEmailResponse: () => Promise<Response> = async () => new Response(JSON.stringify({ id: 're_msg_enq_1' }), { status: 200, statusText: 'OK' });

(globalThis as any).fetch = async (url: string, init: any) => {
  const body = init?.body ? JSON.parse(init.body) : null;
  calls.push({ url: String(url), body, headers: init?.headers || {} });
  if (String(url).includes('facebook.com')) return nextWaResponse();
  if (String(url).includes('resend.com')) return nextEmailResponse();
  return new Response('{}', { status: 200 });
};

const {
  notifyWholesaleEnquirySubmitted,
  processWholesaleNotification,
  processWholesaleNotifications,
  retryWholesaleNotification,
} = require('../src/services/adminNotifications/queue');
const { createWholesaleEnquiry } = require('../src/controllers/wholesaleController');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const ok = (m: string) => {
  passed++;
  console.log('PASS ' + m);
};

async function main() {
  // 1. Successful enquiry creates WhatsApp and email notification jobs
  const validPayload = {
    fullName: 'Ananya Verma',
    businessName: 'Verma Luxury Jewels',
    email: 'ananya@vermajewels.test',
    whatsappNumber: '+91 98765 43210',
    location: 'Jaipur, Rajasthan',
    estimatedQuantity: 250,
    message: 'Interested in stocking silver rings and necklaces.',
  };

  const req1: any = { body: validPayload, headers: {}, socket: { remoteAddress: '10.0.0.1' } };
  let resStatus1 = 0;
  let resJson1: any = null;
  const res1: any = {
    status: (s: number) => { resStatus1 = s; return res1; },
    json: (j: any) => { resJson1 = j; },
  };

  await createWholesaleEnquiry(req1, res1);
  assert.equal(resStatus1, 201, 'enquiry saved');
  assert.ok(resJson1.message.includes('received'));

  // Wait for setImmediate queue processing
  await sleep(60);

  const enq1 = Object.values(enquiries).find((e: any) => e.email === 'ananya@vermajewels.test');
  assert.ok(enq1, 'enquiry stored in db');

  const enqNotifs = notifs.filter((n) => n.enquiryRef === enq1.id);
  assert.equal(enqNotifs.length, 2, '2 notification jobs created: whatsapp and email');
  assert.ok(enqNotifs.every((n) => n.status === 'sent'), 'both notifications delivered');

  // Verify WhatsApp payload parameters
  const waCall = calls.find((c) => c.url.includes('facebook.com'));
  assert.ok(waCall);
  assert.equal(waCall.body.template.name, 'riz_admin_new_wholesale_enquiry');
  const params = waCall.body.template.components[0].parameters.map((p: any) => p.text);
  assert.equal(params[0], enq1.id);
  assert.equal(params[2], 'Ananya Verma');
  assert.equal(params[3], 'Verma Luxury Jewels');
  assert.equal(params[4], '+919876543210');
  assert.equal(params[7], '250 pcs');
  assert.equal(params[8], 'Interested in stocking silver rings and necklaces.');

  // Verify Email payload
  const emailCall = calls.find((c) => c.url.includes('resend.com'));
  assert.ok(emailCall);
  assert.ok(emailCall.body.subject.includes('Verma Luxury Jewels'));
  assert.ok(emailCall.body.html.includes('Ananya Verma'));
  assert.ok(emailCall.headers['Idempotency-Key'], 'resend idempotency key attached');
  ok('1. Successful enquiry creates WhatsApp and email notification jobs with correct details');

  // 2. Invalid enquiry creates no notification jobs
  calls = [];
  const initialNotifCount = notifs.length;
  const invalidReq: any = {
    body: { fullName: 'A', email: 'not-an-email' }, // invalid fields
    headers: {},
    socket: { remoteAddress: '10.0.0.2' },
  };
  let resStatus2 = 0;
  const res2: any = {
    status: (s: number) => { resStatus2 = s; return res2; },
    json: () => {},
  };
  await createWholesaleEnquiry(invalidReq, res2);
  assert.equal(resStatus2, 400, 'validation rejected');
  assert.equal(notifs.length, initialNotifCount, 'no notification jobs queued on validation failure');
  assert.equal(calls.length, 0, 'no provider calls made');
  ok('2. Invalid enquiry creates no notification jobs');

  // 3. Duplicate enquiry does not create duplicate notifications
  // Submit the exact same payload within 10 minutes
  const dupReq: any = { body: validPayload, headers: {}, socket: { remoteAddress: '10.0.0.1' } };
  let resStatus3 = 0;
  let resJson3: any = null;
  const res3: any = {
    status: (s: number) => { resStatus3 = s; return res3; },
    json: (j: any) => { resJson3 = j; },
  };
  await createWholesaleEnquiry(dupReq, res3);
  assert.equal(resStatus3, 200, 'duplicate suppressed with 200');
  assert.equal(resJson3.duplicate, true);
  await sleep(50);
  assert.equal(notifs.filter((n) => n.enquiryRef === enq1.id).length, 2, 'no extra notification rows');
  assert.equal(calls.length, 0, 'no extra notification dispatches');
  ok('3. Duplicate enquiry does not create duplicate notifications');

  // 4. WhatsApp failure does not prevent email delivery
  calls = [];
  nextWaResponse = async () => new Response(JSON.stringify({ error: { code: 132001, message: 'Template not approved' } }), { status: 400 });
  nextEmailResponse = async () => new Response(JSON.stringify({ id: 're_msg_ok' }), { status: 200 });

  const enq4Payload = { ...validPayload, email: 'enquiry4@test.com', businessName: 'Store 4' };
  const req4: any = { body: enq4Payload, headers: {}, socket: { remoteAddress: '10.0.0.4' } };
  let resStatus4 = 0;
  const res4: any = { status: (s: number) => { resStatus4 = s; return res4; }, json: () => {} };
  await createWholesaleEnquiry(req4, res4);
  assert.equal(resStatus4, 201);
  await sleep(60);

  const enq4 = Object.values(enquiries).find((e: any) => e.email === 'enquiry4@test.com');
  const enq4Notifs = notifs.filter((n) => n.enquiryRef === enq4.id);
  const wa4 = enq4Notifs.find((n) => n.channel === 'whatsapp');
  const em4 = enq4Notifs.find((n) => n.channel === 'email');
  assert.equal(wa4.status, 'failed', 'whatsapp failed cleanly');
  assert.equal(em4.status, 'sent', 'email succeeded despite whatsapp failure');
  assert.ok(calls.some((c) => c.url.includes('resend.com')), 'resend API was called');
  ok('4. WhatsApp failure does not prevent email delivery');

  // 5. Email failure does not prevent WhatsApp delivery
  calls = [];
  nextWaResponse = async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.OK5' }] }), { status: 200 });
  nextEmailResponse = async () => new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });

  const enq5Payload = { ...validPayload, email: 'enquiry5@test.com', businessName: 'Store 5' };
  const req5: any = { body: enq5Payload, headers: {}, socket: { remoteAddress: '10.0.0.5' } };
  let resStatus5 = 0;
  const res5: any = { status: (s: number) => { resStatus5 = s; return res5; }, json: () => {} };
  await createWholesaleEnquiry(req5, res5);
  assert.equal(resStatus5, 201);
  await sleep(60);

  const enq5 = Object.values(enquiries).find((e: any) => e.email === 'enquiry5@test.com');
  const enq5Notifs = notifs.filter((n) => n.enquiryRef === enq5.id);
  const wa5 = enq5Notifs.find((n) => n.channel === 'whatsapp');
  const em5 = enq5Notifs.find((n) => n.channel === 'email');
  assert.equal(wa5.status, 'sent', 'whatsapp delivered successfully');
  assert.equal(em5.status, 'pending', 'transient 500 email failure enters pending retry queue');
  assert.equal(em5.attempts, 1);
  ok('5. Email failure does not prevent WhatsApp delivery');

  // 6. Notification failure does not affect successful enquiry submission
  failDb = true; // simulate DB issue specifically on WholesaleNotification table
  const enq6Payload = { ...validPayload, email: 'enquiry6@test.com', businessName: 'Store 6' };
  const req6: any = { body: enq6Payload, headers: {}, socket: { remoteAddress: '10.0.0.6' } };
  let resStatus6 = 0;
  let resJson6: any = null;
  const res6: any = { status: (s: number) => { resStatus6 = s; return res6; }, json: (j: any) => { resJson6 = j; } };

  await createWholesaleEnquiry(req6, res6);
  assert.equal(resStatus6, 201, 'customer enquiry still returns 201 created');
  assert.ok(resJson6.message.includes('received'), 'customer receives success feedback');
  const enq6 = Object.values(enquiries).find((e: any) => e.email === 'enquiry6@test.com');
  assert.ok(enq6, 'enquiry was successfully saved in database despite notification queue error');
  failDb = false;
  ok('6. Notification failure does not affect successful enquiry submission');

  // 7. Retry behaviour works correctly
  // Use failed notification wa4 from test 4
  assert.equal(wa4.status, 'failed');
  nextWaResponse = async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.RETRY_OK' }] }), { status: 200 });

  const retryOutcome = await retryWholesaleNotification(wa4.id);
  assert.equal(retryOutcome, 'requeued', 'failed notification requeued for retry');
  await sleep(60);

  const wa4After = notifs.find((n) => n.id === wa4.id);
  assert.equal(wa4After.status, 'sent', 'notification delivered on retry');
  assert.equal(wa4After.providerMessageId, 'wamid.RETRY_OK');

  // Attempting to retry a 'sent' notification must be rejected
  const sentRetry = await retryWholesaleNotification(wa4.id);
  assert.equal(sentRetry, 'not_failed', 'cannot retry an already sent notification');
  ok('7. Retry behaviour works correctly (failed rows re-queue; sent rows cannot be resent)');

  console.log(`\nwholesale-notifications tests: ALL ${passed} PASSED`);
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
