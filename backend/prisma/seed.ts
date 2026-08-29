import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const img = [
  'https://images.pexels.com/photos/29502969/pexels-photo-29502969.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/36823005/pexels-photo-36823005.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/10907855/pexels-photo-10907855.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/29502932/pexels-photo-29502932.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/29502912/pexels-photo-29502912.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/21235147/pexels-photo-21235147.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/6256046/pexels-photo-6256046.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/19373665/pexels-photo-19373665.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/37601638/pexels-photo-37601638.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/30200528/pexels-photo-30200528.jpeg?auto=compress&cs=tinysrgb&w=900',
];

// Existing seed array from frontend products.ts
const seedRaw: [string, string, string, number, string][] = [
  ['The Quiet Hoop', 'Earrings', 'anti-tarnish', 899, 'Women'],
  ['Mogra Pearl Drops', 'Earrings', 'traditional', 1199, 'Women'],
  ['Everyday Gold Studs', 'Second Studs', 'anti-tarnish', 499, 'Women'],
  ['Meera Textured Ring', 'Rings', 'anti-tarnish', 1299, 'Women'],
  ['Sona Layered Chain', 'Necklaces', 'gold-covering-micro-plated', 1799, 'Women'],
  ['Aara Cuff Bracelet', 'Bracelets', 'anti-tarnish', 1499, 'Women'],
  ['Luna Shell Hoops', 'Earrings', 'fancy', 999, 'Women'],
  ['Nila Signet Ring', 'Rings', 'silver-replica', 1499, 'Unisex'],
  ['Maya Mini Hoops', 'Earrings', 'anti-tarnish', 799, 'Women'],
  ['Kairi Pendant', 'Necklaces', 'anti-tarnish', 1599, 'Women'],
  ['Tara Second Studs', 'Second Studs', 'ad-collections', 399, 'Women'],
  ['Anaya Dome Earrings', 'Earrings', 'riz-house-of-fashion', 1699, 'Women'],
  ['Ira Everyday Chain', 'Chains', 'anti-tarnish', 1899, 'Unisex'],
  ['Vanya Open Ring', 'Rings', 'silver-replica', 1199, 'Women'],
  ['Ruh Gold Bracelet', 'Bracelets', 'gold-covering-micro-plated', 1399, 'Unisex'],
  ['Aria Pearl Pendant', 'Necklaces', 'bridal', 1999, 'Women'],
  ['Dev Minimal Chain', 'Chains', 'mens', 2299, 'Men'],
  ['Riva Sculptural Hoops', 'Earrings', 'ad-collections', 1299, 'Women'],
  ['Kavya Nose Pin', 'Nose Pins', 'anti-tarnish', 599, 'Women'],
  ['Asha Temple Drops', 'Earrings', 'traditional', 1899, 'Women'],
  ['Nava Stack Ring', 'Rings', 'riz-house-of-fashion', 1599, 'Women'],
  ['Riz Classic Cuff', 'Bracelets', 'mens', 1199, 'Men'],
  ['Aadi Signet', 'Rings', 'mens', 2499, 'Men'],
  ['Suhana Chandbali', 'Earrings', 'bridal', 2199, 'Women'],
  ['Kaveri Anklet', 'Anklets', 'anti-tarnish', 999, 'Women'],
  ['Nila Gift Set', 'Jewellery Sets', 'riz-house-of-fashion', 2699, 'Women'],
  ['Little Mogra Studs', 'Kids Jewellery', 'kids', 699, 'Kids'],
  ['Little Riz Bracelet', 'Kids Jewellery', 'kids', 799, 'Kids'],
  ['Tiny Star Chain', 'Kids Jewellery', 'kids', 899, 'Kids'],
  ['Muthu Bridal Set', 'Jewellery Sets', 'bridal', 4999, 'Women'],
  ['Kasavu Jhumka', 'Earrings', 'traditional', 2399, 'Women'],
  ['Malabar Choker', 'Necklaces', 'traditional', 3299, 'Women'],
  ['Kerala Bloom Bangle', 'Bracelets', 'traditional', 1799, 'Women'],
  ['Matte Link Chain', 'Chains', 'mens', 1999, 'Men'],
  ['Aranya Pendant', 'Necklaces', 'silver-replica', 1399, 'Unisex'],
  ['Sia Limited Drops', 'Earrings', 'diamond-replica', 2899, 'Women'],
  ['Riz Mini Hoops', 'Earrings', 'anti-tarnish', 1099, 'Women'],
  ['Veda Bridal Necklace', 'Necklaces', 'bridal', 3999, 'Women'],
  ['Tiny Moon Gift Set', 'Jewellery Sets', 'kids', 1299, 'Kids'],
  ['Kochi Classic Anklet', 'Anklets', 'anti-tarnish', 1199, 'Women'],
];

// Mapping to actual Collection display names
const collectionDisplayNames: Record<string, string> = {
  'anti-tarnish': 'Anti-Tarnish',
  'traditional': 'Traditional',
  'bridal': 'Bridal',
  'mens': "Men's",
  'kids': 'Kids',
  'hair-accessories': 'Hair Accessories',
  'silver-replica': 'Silver Replica',
  'diamond-replica': 'Diamond Replica',
  'ad-collections': 'AD Collections',
  'fancy': 'Fancy',
  'gold-covering-micro-plated': 'Gold Covering & Micro Plated',
  'riz-house-of-fashion': 'RIZ House of Fashion',
};

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing tables
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.shippingRule.deleteMany();

  // 2. Create default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Riz Admin',
      email: 'admin@riz.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '9999999999',
    },
  });

  // 3. Create default Customer
  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@riz.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
      phone: '9876543210',
    },
  });

  // 4. Create addresses
  await prisma.address.create({
    data: {
      userId: customer.id,
      name: 'Test Customer',
      phone: '9876543210',
      email: 'customer@riz.com',
      addressLine: '123, Palace Road, Tripunithura',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682301',
      country: 'India',
      isDefault: true,
    },
  });

  // 5. Create Shipping Rules
  const standardPincodes = ['682001', '682002', '682301', '695001', '695002', '600001', '560001'];
  for (const pin of standardPincodes) {
    await prisma.shippingRule.create({
      data: {
        pincode: pin,
        shippingCharge: 49.0,
      },
    });
  }

  // 6. Create Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500,
        isActive: true,
      },
      {
        code: 'RIZ100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderValue: 999,
        isActive: true,
      },
    ],
  });

  // 7. Seed products
  for (let i = 0; i < seedRaw.length; i++) {
    const [name, category, collectionSlug, price, gender] = seedRaw[i];
    const newArrival = collectionSlug === 'new-arrivals' || i > 35;
    const bestseller = i % 7 === 0;
    const originalPrice = i % 4 === 0 ? price + 400 : null;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const images = [img[i % img.length], img[(i + 3) % img.length], img[(i + 5) % img.length]];

    const collectionName = collectionDisplayNames[collectionSlug] || 'Anti-Tarnish';

    await prisma.product.create({
      data: {
        name,
        slug,
        description: 'A considered piece for days that call for a little more glow. Light enough to live in, distinctive enough to be remembered.',
        price,
        originalPrice,
        category,
        collection: collectionName,
        gender,
        ageGroup: gender === 'Kids' ? 'Kids' : 'Adult',
        images,
        material: i % 2 ? 'Brass with premium alloy' : '925 silver',
        finish: '18K gold vermeil',
        rating: 4.7 - (i % 3) * 0.2,
        reviews: 24 + i * 7,
        stock: i === 18 ? 0 : 12 + i, // Kavya Nose Pin has stock 0
        tags: [collectionSlug, 'gold', 'giftable', category.toLowerCase()],
        featured: i < 10,
        bestseller,
        newArrival,
      },
    });
  }

  // 8. Add a mock Hair Accessories product since none of the 40 original are in it
  await prisma.product.create({
    data: {
      name: 'Kerala Jasmine Blossom Hair Clip',
      slug: 'kerala-jasmine-blossom-hair-clip',
      description: 'Elegant hair accessory styled with gold filigree and delicate white enamel jasmines.',
      price: 699,
      originalPrice: 899,
      category: 'Hair Accessories',
      collection: 'Hair Accessories',
      gender: 'Women',
      ageGroup: 'Adult',
      images: [
        'https://images.pexels.com/photos/30200528/pexels-photo-30200528.jpeg?auto=compress&cs=tinysrgb&w=900',
      ],
      material: 'Brass alloy',
      finish: '18K gold micro plating',
      rating: 4.8,
      reviews: 12,
      stock: 15,
      tags: ['hair-accessories', 'gold', 'traditional'],
      featured: true,
      bestseller: true,
      newArrival: true,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
