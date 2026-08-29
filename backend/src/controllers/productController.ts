import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, collection, query, priceRange, sort } = req.query;

    const whereClause: any = { isActive: true };

    if (category) {
      whereClause.category = String(category);
    }

    if (collection) {
      whereClause.collection = String(collection);
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: String(query), mode: 'insensitive' } },
        { description: { contains: String(query), mode: 'insensitive' } },
        { category: { contains: String(query), mode: 'insensitive' } },
        { collection: { contains: String(query), mode: 'insensitive' } },
        { tags: { has: String(query).toLowerCase() } },
      ];
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
