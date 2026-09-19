import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const APPROVED_GROUPS = ['Collections', 'Replica', 'Fashion'];

export const INITIAL_CATEGORIES = [
  // Collections
  { name: 'Anti-Tarnish', group: 'Collections', sortOrder: 1, description: 'Everyday anti-tarnish jewellery.' },
  { name: 'Traditional', group: 'Collections', sortOrder: 2, description: 'Kerala inspired traditional jewellery.' },
  { name: 'Bridal', group: 'Collections', sortOrder: 3, description: 'Bridal & wedding wear statement pieces.' },
  { name: "Men's", group: 'Collections', sortOrder: 4, description: 'Refined men\'s jewellery collection.' },
  { name: 'Kids', group: 'Collections', sortOrder: 5, description: 'Delicate treasures for kids.' },
  { name: 'Hair Accessories', group: 'Collections', sortOrder: 6, description: 'Hair pins, clips, and ornaments.' },

  // Replica
  { name: 'Silver Replica', group: 'Replica', sortOrder: 10, description: 'Premium silver finish replica pieces.' },
  { name: 'Diamond Replica', group: 'Replica', sortOrder: 11, description: 'High polish diamond replica collection.' },
  { name: 'AD Collections', group: 'Replica', sortOrder: 12, description: 'American Diamond craftsmanship.' },

  // Fashion
  { name: 'Fancy', group: 'Fashion', sortOrder: 20, description: 'Trendy and fancy fashion jewellery.' },
  { name: 'Gold Covering & Micro Plated', group: 'Fashion', sortOrder: 21, description: 'Micro plated gold finish jewellery.' },
  { name: 'RIZ House of Fashion', group: 'Fashion', sortOrder: 22, description: 'Exclusive house designs.' },
];

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

export async function getActiveCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Fetch active categories error:', error);
    res.status(500).json({ error: 'Failed to fetch active categories.' });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, group, description, sortOrder, isActive } = req.body;

    if (!name || !group) {
      res.status(400).json({ error: 'Category name and group are required.' });
      return;
    }

    if (!APPROVED_GROUPS.includes(group)) {
      res.status(400).json({ error: `Group must be one of: ${APPROVED_GROUPS.join(', ')}` });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: 'A category with this name already exists.' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        group,
        description: description ? String(description).trim() : null,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    res.status(201).json({ message: 'Category created successfully.', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
}

export async function editCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, group, description, sortOrder, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    if (group && !APPROVED_GROUPS.includes(group)) {
      res.status(400).json({ error: `Group must be one of: ${APPROVED_GROUPS.join(', ')}` });
      return;
    }

    let slug = category.slug;
    if (name && name.trim() !== category.name) {
      slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existing = await prisma.category.findFirst({ where: { slug, id: { not: id } } });
      if (existing) {
        res.status(400).json({ error: 'A category with this name already exists.' });
        return;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : category.name,
        slug,
        group: group || category.group,
        description: description !== undefined ? (description ? String(description).trim() : null) : category.description,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : category.sortOrder,
        isActive: isActive !== undefined ? !!isActive : category.isActive,
      },
    });

    res.status(200).json({ message: 'Category updated successfully.', category: updated });
  } catch (error) {
    console.error('Edit category error:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    // Also check if any products refer to this category by name or collection string
    const stringMatches = await prisma.product.count({
      where: {
        OR: [
          { categoryId: id },
          { category: { equals: category.name, mode: 'insensitive' } },
          { collection: { equals: category.name, mode: 'insensitive' } },
        ],
      },
    });

    const totalProductCount = Math.max(category._count.products, stringMatches);

    if (totalProductCount > 0) {
      res.status(400).json({
        error: `Cannot delete category "${category.name}". It has ${totalProductCount} linked product(s). Please reassign or deactivate the category instead.`,
        productCount: totalProductCount,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({ message: `Category "${category.name}" deleted successfully.` });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
}

export async function seedCategories(req: Request, res: Response): Promise<void> {
  try {
    let createdCount = 0;
    for (const cat of INITIAL_CATEGORIES) {
      const slug = cat.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            slug,
            group: cat.group,
            sortOrder: cat.sortOrder,
            description: cat.description,
            isActive: true,
          },
        });
        createdCount++;
      }
    }
    res.status(200).json({ message: `Seeded ${createdCount} categories successfully.` });
  } catch (error) {
    console.error('Seed categories error:', error);
    res.status(500).json({ error: 'Failed to seed categories.' });
  }
}
