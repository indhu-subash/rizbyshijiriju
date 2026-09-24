import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const INITIAL_COLLECTIONS = [
  { name: 'Earrings', sortOrder: 1, description: 'Studs, hoops, drops and statement earrings.' },
  { name: 'Hip Chain', sortOrder: 2, description: 'Traditional & modern waist chains.' },
  { name: 'Nose Pin', sortOrder: 3, description: 'Delicate nose pins and rings.' },
  { name: 'Necklaces', sortOrder: 4, description: 'Layering chains, chokers and pendants.' },
  { name: 'Bangles', sortOrder: 5, description: 'Classic gold-plated bangles and kadas.' },
  { name: 'Anklets', sortOrder: 6, description: 'Traditional and minimal anklets.' },
  { name: 'Rings', sortOrder: 7, description: 'Adjustable statement and daily wear rings.' },
  { name: "Men's Jewellery", sortOrder: 8, description: 'Refined chains, rings and accessories for men.' },
  { name: 'Anti-Tarnish', sortOrder: 9, description: 'Everyday anti-tarnish waterproof jewellery.' },
  { name: 'Traditional', sortOrder: 10, description: 'Kerala inspired South Indian craft.' },
  { name: 'Bridal', sortOrder: 11, description: 'Bridal and wedding wear statement sets.' },
  { name: 'Kids', sortOrder: 12, description: 'Delicate treasures for kids.' },
  { name: 'Hair Accessories', sortOrder: 13, description: 'Hair pins, clips and traditional hair ornaments.' },
  { name: 'Silver Replica', sortOrder: 14, description: 'Premium 925 silver lookalikes.' },
  { name: 'Diamond Replica', sortOrder: 15, description: 'High polish diamond replica collection.' },
  { name: 'AD Collections', sortOrder: 16, description: 'Exquisite American Diamond craftsmanship.' },
  { name: 'Fancy', sortOrder: 17, description: 'Trendy fashion jewellery.' },
  { name: 'Gold Covering & Micro Plated', sortOrder: 18, description: 'Micro plated gold finish jewellery.' },
  { name: 'RIZ House of Fashion', sortOrder: 19, description: 'Exclusive house designs and couture edits.' },
];

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Ensure default collections exist in DB
 */
export async function ensureDefaultCollections(): Promise<void> {
  const count = await prisma.collection.count();
  if (count === 0) {
    for (const col of INITIAL_COLLECTIONS) {
      const slug = generateSlug(col.name);
      const existing = await prisma.collection.findFirst({
        where: { OR: [{ slug }, { name: { equals: col.name, mode: 'insensitive' } }] },
      });

      if (!existing) {
        await prisma.collection.create({
          data: {
            name: col.name,
            slug,
            description: col.description,
            sortOrder: col.sortOrder,
            isActive: true,
          },
        });
      }
    }
  }
}

/**
 * Public Endpoint: Get Active Collections for Storefront
 */
export async function getActiveCollections(req: Request, res: Response): Promise<void> {
  try {
    await ensureDefaultCollections();

    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.status(200).json({ collections });
  } catch (error) {
    console.error('Fetch active collections error:', error);
    res.status(500).json({ error: 'Failed to fetch active collections.' });
  }
}

/**
 * Admin Endpoint: Get All Collections (Active & Inactive)
 */
export async function getAdminCollections(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await ensureDefaultCollections();

    const collections = await prisma.collection.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Compute additional product count by string matching to capture legacy product collection fields
    const enrichedCollections = await Promise.all(
      collections.map(async (col) => {
        const stringMatchCount = await prisma.product.count({
          where: {
            collectionId: null,
            collection: { equals: col.name, mode: 'insensitive' },
          },
        });

        return {
          ...col,
          productCount: col._count.products + stringMatchCount,
        };
      })
    );

    res.status(200).json({ collections: enrichedCollections });
  } catch (error) {
    console.error('Fetch admin collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections.' });
  }
}

/**
 * Get Single Collection by Slug or ID
 */
export async function getCollectionBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ id: slug }, { slug: slug.toLowerCase() }, { name: { equals: slug, mode: 'insensitive' } }],
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    res.status(200).json({ collection });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Failed to fetch collection details.' });
  }
}

/**
 * Admin Endpoint: Create Collection
 */
export async function createCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, slug: customSlug, image, description, sortOrder, isActive } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'Collection name is required.' });
      return;
    }

    const cleanName = String(name).trim();
    const slug = customSlug && String(customSlug).trim()
      ? generateSlug(String(customSlug))
      : generateSlug(cleanName);

    // Check duplicate name or slug
    const existingName = await prisma.collection.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });

    if (existingName) {
      res.status(400).json({ error: `A collection named "${cleanName}" already exists.` });
      return;
    }

    const existingSlug = await prisma.collection.findUnique({ where: { slug } });
    if (existingSlug) {
      res.status(400).json({ error: `A collection with slug "${slug}" already exists.` });
      return;
    }

    const collection = await prisma.collection.create({
      data: {
        name: cleanName,
        slug,
        image: image ? String(image).trim() : null,
        description: description ? String(description).trim() : null,
        sortOrder: sortOrder !== undefined && sortOrder !== '' ? parseInt(String(sortOrder), 10) : 0,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    res.status(201).json({ message: 'Collection created successfully.', collection });
  } catch (error: any) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: error.message || 'Failed to create collection.' });
  }
}

/**
 * Admin Endpoint: Edit Collection
 */
export async function editCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, slug: customSlug, image, description, sortOrder, isActive } = req.body;

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    let cleanName = collection.name;
    let slug = collection.slug;

    if (name && String(name).trim() !== collection.name) {
      cleanName = String(name).trim();
      const existingName = await prisma.collection.findFirst({
        where: { id: { not: id }, name: { equals: cleanName, mode: 'insensitive' } },
      });
      if (existingName) {
        res.status(400).json({ error: `A collection named "${cleanName}" already exists.` });
        return;
      }
    }

    if (customSlug && String(customSlug).trim() !== collection.slug) {
      slug = generateSlug(String(customSlug));
      const existingSlug = await prisma.collection.findFirst({
        where: { id: { not: id }, slug },
      });
      if (existingSlug) {
        res.status(400).json({ error: `A collection with slug "${slug}" already exists.` });
        return;
      }
    } else if (name && String(name).trim() !== collection.name && !customSlug) {
      slug = generateSlug(cleanName);
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: cleanName,
        slug,
        image: image !== undefined ? (image ? String(image).trim() : null) : collection.image,
        description: description !== undefined ? (description ? String(description).trim() : null) : collection.description,
        sortOrder: sortOrder !== undefined && sortOrder !== '' ? parseInt(String(sortOrder), 10) : collection.sortOrder,
        isActive: isActive !== undefined ? !!isActive : collection.isActive,
      },
    });

    // Update string collection name on associated products if name changed
    if (cleanName !== collection.name) {
      await prisma.product.updateMany({
        where: { collectionId: id },
        data: { collection: cleanName },
      });
    }

    res.status(200).json({ message: 'Collection updated successfully.', collection: updated });
  } catch (error: any) {
    console.error('Edit collection error:', error);
    res.status(500).json({ error: error.message || 'Failed to update collection.' });
  }
}

/**
 * Admin Endpoint: Toggle Collection Active Status
 */
export async function toggleCollectionActive(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: { isActive: !collection.isActive },
    });

    res.status(200).json({ message: `Collection "${collection.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`, collection: updated });
  } catch (error) {
    console.error('Toggle collection status error:', error);
    res.status(500).json({ error: 'Failed to toggle collection active status.' });
  }
}

/**
 * Admin Endpoint: Delete Collection Safely
 */
export async function deleteCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    // Safely unbind all products associated with this collection
    await prisma.product.updateMany({
      where: {
        OR: [
          { collectionId: id },
          { collection: { equals: collection.name, mode: 'insensitive' } },
        ],
      },
      data: {
        collectionId: null,
      },
    });

    await prisma.collection.delete({ where: { id } });

    res.status(200).json({
      message: `Collection "${collection.name}" deleted successfully. Products remain intact.`,
      collectionId: id,
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection.' });
  }
}

/**
 * Seed Endpoint
 */
export async function seedCollections(req: Request, res: Response): Promise<void> {
  try {
    let createdCount = 0;
    for (const col of INITIAL_COLLECTIONS) {
      const slug = generateSlug(col.name);
      const existing = await prisma.collection.findFirst({
        where: { OR: [{ slug }, { name: { equals: col.name, mode: 'insensitive' } }] },
      });

      if (!existing) {
        await prisma.collection.create({
          data: {
            name: col.name,
            slug,
            description: col.description,
            sortOrder: col.sortOrder,
            isActive: true,
          },
        });
        createdCount++;
      }
    }
    res.status(200).json({ message: `Seeded ${createdCount} collections successfully.` });
  } catch (error) {
    console.error('Seed collections error:', error);
    res.status(500).json({ error: 'Failed to seed collections.' });
  }
}
