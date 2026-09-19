import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, collection, query, priceRange, sort, color, colors } = req.query;

    const whereClause: any = { isActive: true };

    if (category) {
      whereClause.category = String(category);
    }

    if (collection) {
      whereClause.collection = String(collection);
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

// Pre-defined seed raw list for index-based fallback (riz-1 to riz-40)
const seedSlugs: string[] = [
  'the-quiet-hoop', 'mogra-pearl-drops', 'everyday-gold-studs', 'meera-textured-ring',
  'sona-layered-chain', 'aara-cuff-bracelet', 'luna-shell-hoops', 'nila-signet-ring',
  'maya-mini-hoops', 'kairi-pendant', 'tara-second-studs', 'anaya-dome-earrings',
  'ira-everyday-chain', 'vanya-open-ring', 'ruh-gold-bracelet', 'aria-pearl-pendant',
  'dev-minimal-chain', 'riva-sculptural-hoops', 'kavya-nose-pin', 'asha-temple-drops',
  'nava-stack-ring', 'riz-classic-cuff', 'aadi-signet', 'suhana-chandbali',
  'kaveri-anklet', 'nila-gift-set', 'little-mogra-studs', 'little-riz-bracelet',
  'tiny-star-chain', 'muthu-bridal-set', 'kasavu-jhumka', 'malabar-choker',
  'kerala-bloom-bangle', 'matte-link-chain', 'aranya-pendant', 'sia-limited-drops',
  'riz-mini-hoops', 'veda-bridal-necklace', 'tiny-moon-gift-set', 'kochi-classic-anklet'
];

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    // 1. Try finding by slug or id directly
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: slug, isActive: true },
          { id: slug, isActive: true },
        ],
      },
    });

    // 2. Fallback: If slug matches static key pattern like 'riz-8'
    if (!product && slug && slug.toLowerCase().startsWith('riz-')) {
      const idx = parseInt(slug.toLowerCase().replace('riz-', ''), 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < seedSlugs.length) {
        const mappedSlug = seedSlugs[idx];
        product = await prisma.product.findFirst({
          where: { slug: mappedSlug, isActive: true },
        });
      }
    }

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

    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id, isActive: true },
          { slug: id, isActive: true },
        ],
      },
    });

    if (!product && id && id.toLowerCase().startsWith('riz-')) {
      const idx = parseInt(id.toLowerCase().replace('riz-', ''), 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < seedSlugs.length) {
        const mappedSlug = seedSlugs[idx];
        product = await prisma.product.findFirst({
          where: { slug: mappedSlug, isActive: true },
        });
      }
    }

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
