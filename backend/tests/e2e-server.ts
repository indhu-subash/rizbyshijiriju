/* Test harness: real Express routes + real auth middleware, in-memory fake Prisma. NOT used in production. */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'test_secret';
const users: any = { admin1: { id: 'admin1', email: 'admin@test.com', role: 'admin', name: 'Admin', phone: null, createdAt: new Date() } };
const rows: any[] = [{ id: 'seed1', fullName: 'Seed Buyer', businessName: 'Seed Store', email: 'seed@x.com', whatsappNumber: '+919000000000', location: 'Mumbai', estimatedQuantity: 500, message: 'Seed message', status: 'pending', createdAt: new Date(), updatedAt: new Date() }];
let n = 0;
const fake: any = {
  user: { findUnique: async ({ where }: any) => users[where.id] || null },
  wholesaleEnquiry: {
    findFirst: async ({ where }: any) => rows.find((r) => r.email === where.email && r.businessName === where.businessName && r.message === where.message && r.createdAt >= where.createdAt.gte) || null,
    create: async ({ data }: any) => { const r = { id: 'e' + ++n, status: 'pending', createdAt: new Date(), updatedAt: new Date(), ...data }; rows.unshift(r); return r; },
    findMany: async ({ where }: any) => rows.filter((r) => (!where.status || r.status === where.status)),
    count: async () => rows.length,
    groupBy: async () => { const m: any = {}; rows.forEach((r) => (m[r.status] = (m[r.status] || 0) + 1)); return Object.entries(m).map(([status, c]) => ({ status, _count: { _all: c } })); },
    findUnique: async ({ where }: any) => rows.find((r) => r.id === where.id) || null,
    update: async ({ where, data }: any) => { const r = rows.find((x) => x.id === where.id); Object.assign(r, data); return r; },
  },
};
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fake } } as any;
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', require('../src/routes').default);
app.get('/__rows', (_q, r) => r.json(rows));
app.get('/__token', (_q, r) => r.json({ token: jwt.sign({ id: 'admin1', email: 'admin@test.com', role: 'admin', name: 'Admin' }, 'test_secret') }));
app.listen(5055, () => console.log('e2e backend on 5055'));
