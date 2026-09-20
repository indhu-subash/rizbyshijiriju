import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, collection, query, priceRange, sort, color, colors } = req.query;

    const whereClause: any = { isActive: true };

    if (category) {
      const catStr = String(category).trim();
      whereClause.category = {
        equals: catStr,
        mode: 'insensitive',
      };
    }

    if (collection) {
      const colStr = String(collection).trim();
      whereClause.collection = {
        equals: colStr,
        mode: 'insensitive',
      };
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

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
    });

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
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
    });

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
