import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';
import apiRouter from './routes';
import prisma from './config/db';
import { INITIAL_PRODUCTS } from './config/initialProducts';
import { captureWebhookRawBody } from './utils/webhookRawBody';
import { logNotificationConfigStatus, startNotificationWorker } from './services/adminNotifications';
import { syncBestsellers } from './services/bestsellerService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://rizbyshijiru.com',
  'https://www.rizbyshijiru.com',
  'https://rizbyshijiriju.com',
  'https://www.rizbyshijiriju.com',
  'https://rizbyshijiru.vercel.app',
  'https://rizbyshijiriju.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const envOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
  .filter(Boolean)
  .flatMap((val) => (val as string).split(','))
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return true;
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  // Matches apex and subdomains for both domain spellings:
  // e.g. https://rizbyshijiru.com, https://www.rizbyshijiru.com
  // e.g. https://rizbyshijiriju.com, https://www.rizbyshijiriju.com
  if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)*rizbyshijiru\.com$/.test(origin)) {
    return true;
  }
  if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)*rizbyshijiriju\.com$/.test(origin)) {
    return true;
  }
  // Vercel deployment previews
  if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) {
    return true;
  }
  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Request from origin '${origin}' blocked.`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Cookie',
    'X-Idempotency-Key',
    'Idempotency-Key',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Explicit preflight handling across all routes
app.options('*', cors(corsOptions));

app.use(cookieParser());
// SECURITY: keep the exact raw bytes of Razorpay webhook requests so the signature can be verified
// against what Razorpay actually signed (re-serialising req.body would not match). Only for the webhook path.
app.use(express.json({ limit: '50mb', verify: captureWebhookRawBody }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local upload fallbacks in development
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Aggregate API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, async () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

    // Self-healing database auto-migration for PostgreSQL schema additions
    const runSql = async (sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e: any) {
        // Ignore existing column/table warnings
      }
    };

    try {
      await runSql(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;`);
      await runSql(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "collectionId" TEXT;`);
      await runSql(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;`);
      await runSql(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "collectionId" TEXT;`);
      await runSql(`
        CREATE TABLE IF NOT EXISTS "Category" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "description" TEXT,
          "image" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
        );
      `);
      await runSql(`
        CREATE TABLE IF NOT EXISTS "Collection" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "description" TEXT,
          "image" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
        );
      `);
      await runSql(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");`);
      await runSql(`CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug");`);
      console.log('Database auto-migration check completed.');
    } catch (dbMigrateErr) {
      console.warn('Auto-migration warning:', dbMigrateErr);
    }

    // Auto-seed default products if database is empty on server startup
    try {
      const productCount = await prisma.product.count();

      if (productCount === 0) {
        console.log('Database empty! Auto-seeding default product catalog...');

        let seeded = 0;

        for (const item of INITIAL_PRODUCTS) {
          const slug = item.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          const existing = await prisma.product.findUnique({
            where: { slug },
          });

          if (!existing) {
            await prisma.product.create({
              data: {
                name: item.name,
                slug,
                description:
                  item.description ||
                  'A considered piece for days that call for a little more glow. Light enough to live in, distinctive enough to be remembered.',
                price: item.price,
                originalPrice: item.originalPrice || null,
                category: item.category,
                collection: item.collection,
                colors: item.colors || [],
                gender: item.gender || 'Women',
                ageGroup: item.gender === 'Kids' ? 'Kids' : 'Adult',
                images: item.images,
                material: item.material || '925 silver',
                finish: item.finish || '18K gold vermeil',
                stock: item.stock ?? 15,
                tags: [
                  item.collection.toLowerCase(),
                  'gold',
                  'giftable',
                  item.category.toLowerCase(),
                ],
                featured: item.featured ?? false,
                bestseller: item.bestseller ?? false,
                newArrival: item.newArrival ?? false,
                isActive: true,
              },
            });

            seeded++;
          }
        }

        console.log(
          `Successfully auto-seeded ${seeded} default products on startup.`
        );
      }
    } catch (seedErr) {
      console.error('Auto-seed check error on startup:', seedErr);
    }

    // Admin order notifications (WhatsApp + email): report config status and start the recovery worker.
    // Wrapped so that a problem here can never stop the API from serving requests.
    try {
      logNotificationConfigStatus();
      startNotificationWorker();
    } catch (notifyErr) {
      console.error('Admin notification worker failed to start:', notifyErr);
    }

    // Automatically synchronize bestseller product rankings based on actual order sales on startup
    try {
      syncBestsellers().catch((syncErr) => {
        console.error('Startup bestseller sync error:', syncErr?.message || syncErr);
      });
    } catch (syncErr) {
      console.error('Startup bestseller sync caught:', syncErr);
    }
  });
}

export default app;
