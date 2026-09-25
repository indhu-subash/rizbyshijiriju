import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, collection, query, priceRange, sort, color, colors } = req.query;

    const whereClause: any = { isActive: true };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (category) {
      const catStr = String(category).trim();
      const singularCat = catStr.endsWith('s') ? catStr.slice(0, -1) : catStr;
      whereClause.OR = [
        { category: { contains: catStr, mode: 'insensitive' } },
        { category: { contains: singularCat, mode: 'insensitive' } },
        { name: { contains: catStr, mode: 'insensitive' } },
        { tags: { has: catStr.toLowerCase() } },
        { tags: { has: singularCat.toLowerCase() } },
      ];
    }

    if (collection) {
      const colStr = String(collection).trim();
      const lowerCol = colStr.toLowerCase();

      if (lowerCol.includes('new arrival') || lowerCol.includes('new-arrival') || lowerCol === 'new arrivals') {
        whereClause.OR = [
          { createdAt: { gte: thirtyDaysAgo } },
          { newArrival: true },
        ];
      } else {
        const colConditions: any[] = [
          { collection: { contains: colStr, mode: 'insensitive' } },
          { name: { contains: colStr, mode: 'insensitive' } },
          { tags: { has: colStr.toLowerCase() } },
        ];
        if (whereClause.OR) {
          whereClause.AND = [{ OR: whereClause.OR }, { OR: colConditions }];
          delete whereClause.OR;
        } else {
          whereClause.OR = colConditions;
        }
      }
    }

    // Color filter parameter support (single 'color' or 'colors' array / comma-separated)
    const rawColorParam = color || colors;
    if (rawColorParam) {
      const colorList = (Array.isArray(rawColorParam) ? rawColorParam.map(String) : String(rawColorParam).split(','))
        .map((c) => c.trim())
        .filter(Boolean);

      if (colorList.length > 0) {
        const colorVariants = Array.from(
          new Set(
            colorList.flatMap((c) => [
              c,
              c.toLowerCase(),
              c.toUpperCase(),
              c.charAt(0).toUpperCase() + c.slice(1).toLowerCase(),
            ])
          )
        );
        whereClause.colors = { hasSome: colorVariants };
      }
    }

    // Smart multi-field, multi-token case-insensitive search
    if (query) {
      const rawQuery = String(query).trim();
      const tokens = rawQuery.split(/\s+/).filter(Boolean);

      if (tokens.length > 0) {
        const tokenConditions = tokens.map((token) => {
          const capitalized = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
          return {
            OR: [
              { name: { contains: token, mode: 'insensitive' } },
              { description: { contains: token, mode: 'insensitive' } },
              { category: { contains: token, mode: 'insensitive' } },
              { collection: { contains: token, mode: 'insensitive' } },
              { tags: { has: token.toLowerCase() } },
              { colors: { hasSome: [token, token.toLowerCase(), token.toUpperCase(), capitalized] } },
            ],
          };
        });

        whereClause.AND = tokenConditions;
      }
    }

    if (priceRange) {
      const range = String(priceRange);
      if (range === 'Under ₹500') {
        whereClause.price = { lt: 500 };
      } else if (range === '₹500–₹999') {
        whereClause.price = { gte: 500, lt: 1000 };
      } else if (range === '₹1,000–₹1,999') {
        whereClause.price = { gte: 1000, lt: 2000 };
      } else if (range === '₹2,000+') {
        whereClause.price = { gte: 2000 };
      }
    }

    let orderBy: any = [{ featured: 'desc' }, { createdAt: 'desc' }];
    const isBestsellerSort = sort && (String(sort).toLowerCase().includes('best') || String(sort).toLowerCase().includes('bestseller'));

    if (sort) {
      const sortVal = String(sort);
      if (sortVal === 'Price Low to High') {
        orderBy = [{ price: 'asc' }, { createdAt: 'desc' }];
      } else if (sortVal === 'Price High to Low') {
        orderBy = [{ price: 'desc' }, { createdAt: 'desc' }];
      } else if (sortVal === 'Newest') {
        orderBy = [{ createdAt: 'desc' }];
      } else if (!isBestsellerSort) {
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }];
      }
    }

    const PRODUCT_SELECT_FIELDS = {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      originalPrice: true,
      category: true,
      collection: true,
      colors: true,
      gender: true,
      ageGroup: true,
      images: true,
      material: true,
      finish: true,
      rating: true,
      reviews: true,
      stock: true,
      tags: true,
      featured: true,
      bestseller: true,
      newArrival: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    };

    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where: whereClause,
        orderBy: isBestsellerSort ? undefined : orderBy,
      });
    } catch (findErr) {
      console.warn('findMany default query failed, falling back to explicit select fields:', findErr);
      products = await prisma.product.findMany({
        where: whereClause,
        orderBy: isBestsellerSort ? undefined : orderBy,
        select: PRODUCT_SELECT_FIELDS,
      });
    }

    // Compute actual units sold from confirmed/paid OrderItems cleanly
    const salesMap = new Map<string, number>();
    try {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          productId: { not: null },
          order: {
            orderStatus: { notIn: ['Cancelled', 'cancelled', 'FAILED', 'failed'] },
          },
        },
        select: {
          productId: true,
          quantity: true,
        },
      });

      orderItems.forEach((item) => {
        if (item.productId) {
          const current = salesMap.get(item.productId) || 0;
          salesMap.set(item.productId, current + (item.quantity || 1));
        }
      });
    } catch (err) {
      console.warn('Could not compute sales rankings dynamically:', err);
    }

    // Map unitsSold & derive dynamic bestseller & newArrival status
    let mappedProducts = products.map((p) => {
      const unitsSold = salesMap.get(p.id) || 0;
      const isNew = p.createdAt ? (new Date(p.createdAt).getTime() >= thirtyDaysAgo.getTime()) : !!p.newArrival;
      // BESTSELLER badge ONLY for products with actual sales > 0
      const isBestseller = unitsSold > 0 || p.bestseller;

      return {
        ...p,
        unitsSold,
        bestseller: isBestseller,
        newArrival: isNew,
      };
    });

    if (isBestsellerSort) {
      mappedProducts.sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) {
          return b.unitsSold - a.unitsSold;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.status(200).json({ products: mappedProducts });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products.', details: error?.message || String(error) });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeSlug(str: string): string {
  let decoded = str;
  try {
    decoded = decodeURIComponent(str);
  } catch (e) {
    decoded = str;
  }
  return decoded
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export async function findProductBySlugOrId(identifier: string, mustBeActive = true) {
  if (!identifier || typeof identifier !== 'string') return null;

  let decoded = identifier.trim();
  try {
    decoded = decodeURIComponent(identifier).trim();
  } catch (e) {
    decoded = identifier.trim();
  }

  if (!decoded) return null;

  const normalized = normalizeSlug(decoded);
  const unhyphenated = decoded.replace(/-/g, ' ').trim();
  const activeCondition = mustBeActive ? { isActive: true } : {};

  // 1. Try exact ID match (whether UUID or custom string ID)
  let product = await prisma.product.findFirst({
    where: { id: decoded, ...activeCondition },
  });
  if (product) return product;

  // 2. Try case-insensitive ID match
  product = await prisma.product.findFirst({
    where: { id: { equals: decoded, mode: 'insensitive' }, ...activeCondition },
  });
  if (product) return product;

  // 3. Try exact slug match
  product = await prisma.product.findFirst({
    where: { slug: decoded, ...activeCondition },
  });
  if (product) return product;

  // 4. Try case-insensitive slug match
  product = await prisma.product.findFirst({
    where: { slug: { equals: decoded, mode: 'insensitive' }, ...activeCondition },
  });
  if (product) return product;

  // 5. Try exact case-insensitive name match
  product = await prisma.product.findFirst({
    where: { name: { equals: decoded, mode: 'insensitive' }, ...activeCondition },
  });
  if (product) return product;

  // 6. Try unhyphenated name match (exact case-insensitive)
  if (unhyphenated) {
    product = await prisma.product.findFirst({
      where: { name: { equals: unhyphenated, mode: 'insensitive' }, ...activeCondition },
    });
    if (product) return product;
  }

  // 7. Try normalized slug match (exact case-insensitive)
  if (normalized) {
    product = await prisma.product.findFirst({
      where: { slug: { equals: normalized, mode: 'insensitive' }, ...activeCondition },
    });
    if (product) return product;
  }

  return null;
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const product = await findProductBySlugOrId(slug, true);

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Fetch product by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await findProductBySlugOrId(id, true);

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Fetch product by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
}
