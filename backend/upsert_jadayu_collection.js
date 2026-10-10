require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const name = 'Jadayu Collections';
  const slug = 'jadayu-collections';
  const description = 'Discover the distinctive elegance of Jadayu Collections, featuring statement jewellery crafted to make every occasion memorable.';
  const image = '/jadayu-collections.jpg';

  console.log('Checking for existing collection record...');

  const existing = await prisma.collection.findFirst({
    where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] },
  });

  if (existing) {
    console.log('Collection already exists:', existing.id, existing.name);
    const updated = await prisma.collection.update({
      where: { id: existing.id },
      data: {
        name,
        slug,
        description,
        image: existing.image || image,
        isActive: true,
      },
    });
    console.log('Updated existing collection safely:', updated);
  } else {
    const maxSort = await prisma.collection.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSort._max.sortOrder || 0) + 1;

    const created = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        image,
        isActive: true,
        sortOrder: nextSortOrder,
      },
    });
    console.log('Created new collection:', created);
  }
}

main()
  .catch((e) => {
    console.error('Upsert failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
