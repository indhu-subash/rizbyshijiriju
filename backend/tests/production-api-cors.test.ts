/* Comprehensive test of production API endpoints and CORS configuration. */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';

// ---- in-memory fake db injected in place of src/config/db ----
const users: Record<string, any> = {
  admin1: { id: 'admin1', email: 'admin@rizbyshijiru.com', role: 'admin', name: 'Admin' },
  cust1: { id: 'cust1', email: 'customer@example.com', role: 'customer', name: 'Customer' },
};

const productsList: any[] = [
  {
    id: 'prod-1',
    name: 'Gleam Necklace',
    slug: 'gleam-necklace',
    description: 'A beautiful gold vermeil necklace.',
    price: 1499,
    originalPrice: 1999,
    category: 'Necklaces',
    collection: 'New Arrivals',
    colors: ['Gold'],
    gender: 'Women',
    ageGroup: 'Adult',
    images: ['https://example.com/p1.jpg'],
    material: '925 silver',
    finish: '18K gold vermeil',
    rating: 4.8,
    reviews: 12,
    stock: 20,
    tags: ['new arrivals', 'necklaces', 'gold'],
    featured: true,
    bestseller: true,
    newArrival: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-2',
    name: 'Sparkle Earrings',
    slug: 'sparkle-earrings',
    description: 'Anti-tarnish silver earrings.',
    price: 899,
    originalPrice: 1299,
    category: 'Earrings',
    collection: 'Anti-Tarnish',
    colors: ['Silver', 'Rose Gold'],
    gender: 'Women',
    ageGroup: 'Adult',
    images: ['https://example.com/p2.jpg'],
    material: '925 silver',
    finish: 'Rhodium',
    rating: 4.9,
    reviews: 25,
    stock: 15,
    tags: ['anti-tarnish', 'earrings', 'silver'],
    featured: true,
    bestseller: true,
    newArrival: false,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    updatedAt: new Date(),
  },
];

const couponsList: any[] = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscount: 200,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    usageLimit: 100,
    usedCount: 5,
  },
];

const enquiryRows: any[] = [];
let seq = 0;

const fakeDb: any = {
  user: {
    findUnique: async ({ where }: any) => users[where.id] || Object.values(users).find((u) => u.email === where.email) || null,
  },
  product: {
    findMany: async ({ where, orderBy }: any) => {
      let filtered = [...productsList];
      if (where?.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === where.isActive);
      }
      if (where?.category) {
        filtered = filtered.filter((p) => p.category.toLowerCase() === (where.category.equals || where.category).toLowerCase());
      }
      return filtered;
    },
    count: async () => productsList.length,
    findFirst: async ({ where }: any) => productsList.find((p) => p.id === where.id || p.slug === where.slug) || null,
  },
  collection: {
    findFirst: async ({ where }: any) => null,
  },
  orderItem: {
    findMany: async () => [
      { productId: 'prod-1', quantity: 10 },
      { productId: 'prod-2', quantity: 5 },
    ],
  },
  coupon: {
    findMany: async () => couponsList,
  },
  wholesaleEnquiry: {
    findFirst: async ({ where }: any) =>
      enquiryRows.find((r) => r.email === where.email && r.businessName === where.businessName && r.message === where.message) || null,
    create: async ({ data }: any) => {
      const r = { id: 'enq-' + ++seq, status: 'pending', createdAt: new Date(), updatedAt: new Date(), ...data };
      enquiryRows.push(r);
      return r;
    },
    count: async () => enquiryRows.length,
    findMany: async () => enquiryRows,
  },
  wholesaleNotification: {
    createMany: async () => ({ count: 2 }),
    findMany: async () => [],
  },
};

const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { __esModule: true, default: fakeDb } } as any;

// Test the REAL exported Express application and CORS configuration from src/server.ts
const serverModule = require('../src/server');
const app = serverModule.default;
const isOriginAllowed = serverModule.isOriginAllowed;

async function runTests() {
  console.log('--- Starting Production API & CORS Test Suite ---');

  // 1. Origin verification unit tests
  console.log('1. Testing isOriginAllowed() helper...');
  assert.equal(isOriginAllowed('https://rizbyshijiru.com'), true, 'apex rizbyshijiru.com must be allowed');
  assert.equal(isOriginAllowed('https://www.rizbyshijiru.com'), true, 'www.rizbyshijiru.com must be allowed');
  assert.equal(isOriginAllowed('https://shop.rizbyshijiru.com'), true, 'subdomain of rizbyshijiru.com must be allowed');
  assert.equal(isOriginAllowed('https://rizbyshijiriju.com'), true, 'apex rizbyshijiriju.com must be allowed');
  assert.equal(isOriginAllowed('https://www.rizbyshijiriju.com'), true, 'www.rizbyshijiriju.com must be allowed');
  assert.equal(isOriginAllowed('https://rizbyshijiru.vercel.app'), true, 'vercel preview domain must be allowed');
  assert.equal(isOriginAllowed('https://my-preview-branch.vercel.app'), true, 'vercel deployment domain must be allowed');
  assert.equal(isOriginAllowed('http://localhost:3000'), true, 'localhost:3000 must be allowed');
  assert.equal(isOriginAllowed('http://127.0.0.1:3000'), true, '127.0.0.1:3000 must be allowed');
  assert.equal(isOriginAllowed(undefined), true, 'requests without origin (server-to-server, curl) must be allowed');
  assert.equal(isOriginAllowed('https://evil-spoof.com'), false, 'unauthorized origins must be blocked');
  assert.equal(isOriginAllowed('https://notrizbyshijiru.com'), false, 'spoofed domains must be blocked');
  console.log('PASS: Origin allowlist rules verified.');

  // 2. HTTP Server integration tests
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const originProduction = 'https://rizbyshijiru.com';
    const originWww = 'https://www.rizbyshijiru.com';

    // 2A. Health check endpoints
    console.log('2A. Testing /health and /api/health...');
    const resHealth = await fetch(`${baseUrl}/health`);
    assert.equal(resHealth.status, 200);
    const bodyHealth = await resHealth.json();
    assert.equal(bodyHealth.status, 'ok');

    const resApiHealth = await fetch(`${baseUrl}/api/health`);
    assert.equal(resApiHealth.status, 200);
    const bodyApiHealth = await resApiHealth.json();
    assert.equal(bodyApiHealth.status, 'ok');
    console.log('PASS: Health check endpoints respond with 200 OK.');

    // 2B. Preflight OPTIONS requests
    console.log('2B. Testing OPTIONS preflight requests for https://rizbyshijiru.com...');
    const preflightOptions = {
      method: 'OPTIONS',
      headers: {
        'Origin': originProduction,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    };

    const resWholesaleOptions = await fetch(`${baseUrl}/api/wholesale/enquiries`, preflightOptions);
    assert.equal(resWholesaleOptions.status, 204, 'OPTIONS /api/wholesale/enquiries must return 204');
    assert.equal(resWholesaleOptions.headers.get('access-control-allow-origin'), originProduction);
    assert.equal(resWholesaleOptions.headers.get('access-control-allow-credentials'), 'true');
    assert(resWholesaleOptions.headers.get('access-control-allow-methods')?.includes('POST'));

    const resProductsOptions = await fetch(`${baseUrl}/api/products`, {
      method: 'OPTIONS',
      headers: {
        'Origin': originWww,
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(resProductsOptions.status, 204);
    assert.equal(resProductsOptions.headers.get('access-control-allow-origin'), originWww);
    console.log('PASS: OPTIONS preflight returns 204 with exact CORS origin and credentials.');

    // 2C. Products API and all 6 queries
    console.log('2C. Testing Products API queries with CORS...');
    const productQueries = [
      '',
      '?sort=Bestseller',
      '?collection=New+Arrivals&sort=Newest',
      '?collection=Anti-Tarnish',
      '?category=Necklaces&sort=Featured',
      '?category=Earrings&sort=Featured',
    ];

    for (const q of productQueries) {
      const res = await fetch(`${baseUrl}/api/products${q}`, {
        headers: { Origin: originProduction },
      });
      assert.equal(res.status, 200, `GET /api/products${q} must return 200`);
      assert.equal(res.headers.get('access-control-allow-origin'), originProduction);
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
      const data = await res.json();
      assert(Array.isArray(data.products), `Expected products array for ${q}`);
    }
    console.log('PASS: All 6 product query variants respond with 200 and proper CORS headers.');

    // 2D. Auth /me endpoint
    console.log('2D. Testing /api/auth/me...');
    // Unauthenticated request must return 401 with CORS headers (NOT 500 or network error)
    const resAuthAnon = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Origin: originProduction },
    });
    assert.equal(resAuthAnon.status, 401, 'Unauthenticated /auth/me must return 401');
    assert.equal(resAuthAnon.headers.get('access-control-allow-origin'), originProduction);
    assert.equal(resAuthAnon.headers.get('access-control-allow-credentials'), 'true');

    // Authenticated request with token must return user
    const token = jwt.sign({ id: 'cust1', email: 'customer@example.com', role: 'customer', name: 'Customer' }, 'test_secret');
    const resAuthCust = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Origin: originProduction, Authorization: `Bearer ${token}` },
    });
    assert.equal(resAuthCust.status, 200);
    const bodyCust = await resAuthCust.json();
    assert.equal(bodyCust.user.email, 'customer@example.com');
    console.log('PASS: /auth/me returns 401 for anonymous and 200 for authenticated, both with CORS headers.');

    // 2E. Public coupons endpoint
    console.log('2E. Testing /api/coupons/public...');
    const resCoupons = await fetch(`${baseUrl}/api/coupons/public`, {
      headers: { Origin: originProduction },
    });
    assert.equal(resCoupons.status, 200);
    assert.equal(resCoupons.headers.get('access-control-allow-origin'), originProduction);
    const bodyCoupons = await resCoupons.json();
    assert(Array.isArray(bodyCoupons.coupons));
    assert(bodyCoupons.coupons.length > 0);
    assert.equal(bodyCoupons.coupons[0].code, 'WELCOME10');

    // Test database error returns 500 with CORS headers intact (not masking as 200)
    const origFindMany = fakeDb.coupon.findMany;
    fakeDb.coupon.findMany = async () => { throw new Error('DB connection failed'); };
    const resCouponsErr = await fetch(`${baseUrl}/api/coupons/public`, {
      headers: { Origin: originProduction },
    });
    assert.equal(resCouponsErr.status, 500, 'Coupon DB failure must return 500 for observability');
    assert.equal(resCouponsErr.headers.get('access-control-allow-origin'), originProduction, 'CORS headers must be preserved on 500 errors');
    fakeDb.coupon.findMany = origFindMany;
    console.log('PASS: /coupons/public returns active coupons when healthy, and 500 with CORS when DB fails.');

    // 2F. Wholesale enquiry submission
    console.log('2F. Testing POST /api/wholesale/enquiries...');
    const validEnquiry = {
      fullName: 'Sunita Sharma',
      businessName: 'Sharma Boutique',
      email: 'sunita@sharmaboutique.in',
      whatsappNumber: '+919876543210',
      location: 'Bengaluru',
      estimatedQuantity: 250,
      message: 'Looking for wholesale anti-tarnish jewelry catalog.',
    };

    const resSubmit = await fetch(`${baseUrl}/api/wholesale/enquiries`, {
      method: 'POST',
      headers: {
        'Origin': originProduction,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validEnquiry),
    });

    assert.equal(resSubmit.status, 201, 'Valid enquiry should return 201');
    assert.equal(resSubmit.headers.get('access-control-allow-origin'), originProduction);
    const bodySubmit = await resSubmit.json();
    assert(bodySubmit.message.includes('received'), 'Should receive success message');

    // Validation failure must also retain CORS headers
    const resInvalid = await fetch(`${baseUrl}/api/wholesale/enquiries`, {
      method: 'POST',
      headers: {
        'Origin': originProduction,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'bad' }),
    });

    assert.equal(resInvalid.status, 400, 'Invalid enquiry should return 400');
    assert.equal(resInvalid.headers.get('access-control-allow-origin'), originProduction);
    console.log('PASS: Wholesale enquiry POST creates record and preserves CORS headers on success & errors.');

    // 2G. Blocked origin test
    console.log('2G. Testing blocked origin...');
    const resBlocked = await fetch(`${baseUrl}/api/products`, {
      headers: { Origin: 'https://attacker-site.com' },
    });
    assert.equal(resBlocked.headers.get('access-control-allow-origin'), null, 'Blocked origin must not have allow-origin header');
    console.log('PASS: Unauthorized origin receives no CORS headers.');

  } finally {
    server.close();
  }

  console.log('\nALL 7 PRODUCTION API & CORS TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
