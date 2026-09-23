import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';
import apiRouter from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://rizbyshijiriju.com',
  'https://www.rizbyshijiriju.com',
  'https://rizbyshijiriju.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

const envOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
  .filter(Boolean)
  .flatMap((val) => (val as string).split(','))
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        ALLOWED_ORIGINS.includes(origin) ||
        /^https:\/\/(?:[a-zA-Z0-9-]+\.)*rizbyshijiriju\.com$/.test(origin) ||
        /^https:\/\/(?:[a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Request from origin '${origin}' blocked.`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
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
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});

import prisma from './config/db';
import { INITIAL_PRODUCTS } from './config/initialProducts';

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

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
});
