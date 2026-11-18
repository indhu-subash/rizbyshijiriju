/* HTTP-level test of the real routes + real auth middleware with an in-memory fake Prisma. */
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test_secret';

// ---- in-memory fake db injected in place of src/config/db ----
const users: Record<string, any> = {
  admin1: { id: 'admin1', email: 'a@x.com', role: 'admin', name: 'Admin' },
  cust1: { id: 'cust1', email: 'c@x.com', role: 'customer', name: 'Cust' },
};
const rows: any[] = [];
let seq = 0;
const fake: any = {
  user: { findUnique: async ({ where }: any) => users[where.id] || null },
  wholesaleEnquiry: {
    findFirst: async ({ where }: any) =>
      rows.find((r) => r.email === where.email && r.businessName === where.businessName && r.whatsappNumber === where.whatsappNumber && r.message === where.message && r.createdAt >= where.createdAt.gte) || null,
    create: async ({ data }: any) => { const r = { id: 'e' + ++seq, status: 'pending', createdAt: new Date(), updatedAt: new Date(), ...data }; rows.push(r); return r; },
    findMany: async ({ where }: any) => rows.filter((r) => !where.status || r.status === where.status),
    count: async ({ where }: any) => rows.filter((r) => !where.status || r.status === where.status).length,
    groupBy: async () => { const m: any = {}; rows.forEach((r) => (m[r.status] = (m[r.status] || 0) + 1)); return Object.entries(m).map(([status, n]) => ({ status, _count: { _all: n } })); },
    findUnique: async ({ where }: any) => rows.find((r) => r.id === where.id) || null,
    update: async ({ where, data }: any) => { const r = rows.find((x) => x.id === where.id); Object.assign(r, data); return r; },
  },
};
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fake } } as any;
const routes = require('../src/routes').default;

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api', routes);

const tok = (id: string) => jwt.sign({ id, email: 'x', role: users[id].role, name: 'n' }, 'test_secret');
const valid = { fullName: 'Asha Nair', businessName: 'Asha Jewels', email: 'asha@example.com', whatsappNumber: '+919876543210', location: 'Kochi', estimatedQuantity: 100, message: 'Need catalogue' };

async function main() {
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const call = (path: string, init: any = {}, token?: string, ip = '1.1.1.1') =>
    fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const post = (b: any, ip?: string) => call('/wholesale/enquiries', { method: 'POST', body: JSON.stringify(b) }, undefined, ip);

  // validation errors
  let r = await post({ ...valid, email: 'bad' }, '9.9.9.1');
  assert.equal(r.status, 400); assert.ok((await r.json()).fieldErrors.email);

  // create + duplicate idempotency
  r = await post(valid, '9.9.9.2'); assert.equal(r.status, 201); assert.equal(rows.length, 1);
  r = await post(valid, '9.9.9.2'); assert.equal(r.status, 200); assert.equal((await r.json()).duplicate, true); assert.equal(rows.length, 1, 'duplicate must not create a 2nd row');
  r = await post({ ...valid, message: 'different message' }, '9.9.9.2'); assert.equal(r.status, 201); assert.equal(rows.length, 2);

  // honeypot: fake success, nothing stored
  r = await post({ ...valid, email: 'bot@example.com', website: 'http://spam' }, '9.9.9.3'); assert.equal(r.status, 201); assert.equal(rows.length, 2);

  // rate limit (8/hour per IP): 2 already used above by 9.9.9.2 + 1 dup -> use fresh ip
  let last = 0;
  for (let i = 0; i < 10; i++) last = (await post({ ...valid, email: `u${i}@example.com` }, '8.8.8.8')).status;
  assert.equal(last, 429, 'rate limit should kick in');

  // admin protection
  r = await call('/admin/wholesale-enquiries'); assert.equal(r.status, 401, 'no token => 401');
  r = await call('/admin/wholesale-enquiries', {}, tok('cust1')); assert.equal(r.status, 403, 'customer => 403');
  r = await call('/admin/wholesale-enquiries', {}, tok('admin1')); assert.equal(r.status, 200);
  const body: any = await r.json(); assert.ok(body.enquiries.length >= 2); assert.ok(body.counts.pending >= 2);
  r = await call('/admin/wholesale-enquiries/e1', { method: 'PATCH', body: JSON.stringify({ status: 'contacted' }) });
  assert.equal(r.status, 401);
  r = await call('/admin/wholesale-enquiries/e1', { method: 'PATCH', body: JSON.stringify({ status: 'contacted' }) }, tok('cust1'));
  assert.equal(r.status, 403);

  // status update
  r = await call('/admin/wholesale-enquiries/e1', { method: 'PATCH', body: JSON.stringify({ status: 'Approved' }) }, tok('admin1'));
  assert.equal(r.status, 200); assert.equal(rows[0].status, 'approved');
  r = await call('/admin/wholesale-enquiries/e1', { method: 'PATCH', body: JSON.stringify({ status: 'hacked' }) }, tok('admin1')); assert.equal(r.status, 400);
  r = await call('/admin/wholesale-enquiries/nope', { method: 'PATCH', body: JSON.stringify({ status: 'pending' }) }, tok('admin1')); assert.equal(r.status, 404);

  // no public read endpoint exists
  r = await call('/wholesale/enquiries'); assert.equal(r.status, 404, 'GET on public route must not list data');

  server.close();
  console.log('wholesale HTTP tests (auth, validation, idempotency, honeypot, rate-limit): ALL PASSED');
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
