import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, collection, query, priceRange, sort, color, colors } = req.query;

    const whereClause: any = { isActive: true };

    if (category) {
      const catStr = String(category).trim();
      const singularCat = catStr.endsWith('s') ? catStr.slice(0, -1) : catStr;
      whereClause.OR = [
        { category: { contains: catStr, mode: 'insensitive' } },
        { category: { contains: singularCat, mode: 'insensitive' } },
        { categoryRel: { name: { contains: catStr, mode: 'insensitive' } } },
        { name: { contains: catStr, mode: 'insensitive' } },
        { tags: { has: catStr.toLowerCase() } },
        { tags: { has: singularCat.toLowerCase() } },
      ];
    }

    if (collection) {
      const colStr = String(collection).trim();
      const colConditions = [
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

    // Color filter parameter support (single 'color' or 'colors' array / comma-separated)
    const rawColorParam = color || colors;
    if (rawColorParam) {
      const colorList = (Array.isArray(rawColorParam) ? rawColorParam.map(String) : String(rawColorParam).split(','))
        .map((c) => c.trim())
        .filter(Boolean);

      if (colorList.length > 0) {
        // Expand variants (e.g. "Blue", "blue", "BLUE") for maximum match flexibility
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

    let orderBy: any = {};
    if (sort) {
      const sortVal = String(sort);
      if (sortVal === 'Price Low to High') {
        orderBy = { price: 'asc' };
      } else if (sortVal === 'Price High to Low') {
        orderBy = { price: 'desc' };
      } else if (sortVal === 'Newest') {
        orderBy = { newArrival: 'desc' };
      } else if (sortVal === 'Best Selling') {
        orderBy = { bestseller: 'desc' };
      } else {
        orderBy = { featured: 'desc' };
      }
    } else {
      orderBy = { featured: 'desc' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy,
      include: {
        categoryRel: true,
      },
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
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

  const normalized = normalizeSlug(decoded);
  const isUuid = UUID_REGEX.test(decoded);

  const activeCondition = mustBeActive ? { isActive: true } : {};

  // 1. Try exact UUID/id match if valid UUID
  if (isUuid) {
    const byId = await prisma.product.findFirst({
      where: { id: decoded, ...activeCondition },
    });
    if (byId) return byId;
  }

  // 2. Try exact slug match
  const byExactSlug = await prisma.product.findFirst({
    where: { slug: decoded, ...activeCondition },
  });
  if (byExactSlug) return byExactSlug;

  // 3. Try case-insensitive slug match
  const byCaseSlug = await prisma.product.findFirst({
    where: { slug: { equals: decoded, mode: 'insensitive' }, ...activeCondition },
  });
  if (byCaseSlug) return byCaseSlug;

  // 4. Try normalized slug match
  if (normalized) {
    const byNormSlug = await prisma.product.findFirst({
      where: { slug: { equals: normalized, mode: 'insensitive' }, ...activeCondition },
    });
    if (byNormSlug) return byNormSlug;
  }

  // 5. Try case-insensitive name match
  const byName = await prisma.product.findFirst({
    where: { name: { equals: decoded, mode: 'insensitive' }, ...activeCondition },
  });
  if (byName) return byName;

  // 6. Try matching name with hyphens replaced by spaces
  if (decoded.includes('-')) {
    const unhyphenated = decoded.replace(/-/g, ' ');
    const byUnhyphenatedName = await prisma.product.findFirst({
      where: { name: { equals: unhyphenated, mode: 'insensitive' }, ...activeCondition },
    });
    if (byUnhyphenatedName) return byUnhyphenatedName;
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
