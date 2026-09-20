import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadImage, deleteImage } from '../services/uploadService';

// 1. Dashboard Analytics
export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalOrders = await prisma.order.count();
    
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      select: { total: true },
    });
    const totalRevenue = paidOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const totalCustomers = await prisma.user.count({ where: { role: 'customer' } });

    const lowStockItems = await prisma.product.count({
      where: { stock: { lte: 3, gt: 0 }, isActive: true },
    });
    const outOfStockItems = await prisma.product.count({
      where: { stock: 0, isActive: true },
    });

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    // Best-selling products (simple grouping based on quantity sold)
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const bestSellers = orderItems.map((item: any) => ({
      name: item.name,
      quantitySold: item._sum.quantity || 0,
    }));

    res.status(200).json({
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      lowStockItems,
      outOfStockItems,
      recentOrders,
      bestSellers,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
}

// 2. Orders Management
export async function getAdminOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, query } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.orderStatus = String(status);
    }

    if (query) {
      whereClause.OR = [
        { orderId: { contains: String(query), mode: 'insensitive' } },
        { shippingName: { contains: String(query), mode: 'insensitive' } },
        { shippingEmail: { contains: String(query), mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: orderStatus || order.orderStatus,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
      },
    });

    res.status(200).json({ message: 'Order status updated successfully.', order: updated });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order.' });
  }
}

// 3. Products CRUD
export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      collection,
      categoryId,
      colors,
      gender,
      ageGroup,
      material,
      finish,
      stock,
      tags,
      featured,
      bestseller,
      newArrival,
      images,
    } = req.body;

    if (!name || !description || !price || !category || !collection || !material || !finish) {
      res.status(400).json({ error: 'Required fields are missing.' });
      return;
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: 'A product with this name (or similar URL slug) already exists.' });
      return;
    }

    const tagsArr = tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim())) : [];
    const colorsArr = colors ? (Array.isArray(colors) ? colors : String(colors).split(',').map((c) => c.trim())) : [];
    const rawImages = images ? (Array.isArray(images) ? images : [images]) : [];
    const imagesArr = rawImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0).map((img: string) => img.trim());

    let validCategoryId: string | null = null;
    if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
      const catExists = await prisma.category.findUnique({ where: { id: categoryId.trim() } });
      if (catExists) {
        validCategoryId = catExists.id;
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        category,
        collection,
        categoryId: validCategoryId,
        colors: colorsArr,
        gender: gender || 'Women',
        ageGroup: ageGroup || 'Adult',
        images: imagesArr,
        material,
        finish,
        stock: parseInt(stock) || 0,
        tags: tagsArr,
        featured: !!featured,
        bestseller: !!bestseller,
        newArrival: !!newArrival,
      },
    });

    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
}

export async function editProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      collection,
      categoryId,
      colors,
      gender,
      ageGroup,
      material,
      finish,
      stock,
      tags,
      featured,
      bestseller,
      newArrival,
      images,
      isActive,
    } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const tagsArr = tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim())) : product.tags;
    const colorsArr = colors ? (Array.isArray(colors) ? colors : String(colors).split(',').map((c) => c.trim())) : product.colors;
    
    let imagesArr = product.images;
    if (images !== undefined) {
      const rawImages = Array.isArray(images) ? images : [images];
      const validImages = rawImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0).map((img: string) => img.trim());
      if (validImages.length > 0) {
        imagesArr = validImages;
      }
    }

    let slug = product.slug;
    if (name && typeof name === 'string' && name.trim() && name.trim() !== product.name) {
      const generatedSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (generatedSlug.length > 0) {
        slug = generatedSlug;
        const existing = await prisma.product.findFirst({ where: { slug, id: { not: id } } });
        if (existing) {
          slug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
        }
      }
    }

    // Safely validate categoryId to prevent Prisma foreign key constraint errors (P2003)
    let validCategoryId: string | null = null;
    const candidateCatId = categoryId !== undefined ? categoryId : product.categoryId;
    if (candidateCatId && typeof candidateCatId === 'string' && candidateCatId.trim().length > 0) {
      const catExists = await prisma.category.findUnique({ where: { id: candidateCatId.trim() } });
      if (catExists) {
        validCategoryId = catExists.id;
      }
    }

    const parsedPrice = price !== undefined && !isNaN(parseFloat(price)) ? parseFloat(price) : product.price;
    
    let parsedOriginalPrice: number | null = product.originalPrice;
    if (originalPrice !== undefined) {
      parsedOriginalPrice = originalPrice && !isNaN(parseFloat(originalPrice)) ? parseFloat(originalPrice) : null;
    }

    const parsedStock = stock !== undefined && !isNaN(parseInt(stock)) ? parseInt(stock) : product.stock;
    const itemMaterial = material || req.body.metal || product.material || 'Silver';
    const itemFinish = finish || product.finish || 'Polished';

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : product.name,
        slug,
        description: description ? String(description).trim() : product.description,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        category: category ? String(category).trim() : product.category,
        collection: collection ? String(collection).trim() : product.collection,
        categoryId: validCategoryId,
        colors: colorsArr,
        gender: gender || product.gender,
        ageGroup: ageGroup || product.ageGroup,
        images: imagesArr,
        material: itemMaterial,
        finish: itemFinish,
        stock: parsedStock,
        tags: tagsArr,
        featured: featured !== undefined ? !!featured : product.featured,
        bestseller: bestseller !== undefined ? !!bestseller : product.bestseller,
        newArrival: newArrival !== undefined ? !!newArrival : product.newArrival,
        isActive: isActive !== undefined ? !!isActive : product.isActive,
      },
    });

    res.status(200).json({ message: 'Product updated successfully.', product: updated });
  } catch (error: any) {
    console.error('Edit product error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update product.' });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Soft delete/deactivate so existing orders don't break
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ message: 'Product deactivated successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

// 4. Coupons Management
export async function getAdminCoupons(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
}

export async function createCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = req.body;

    if (!code || !discountType || !discountValue) {
      res.status(400).json({ error: 'Code, discount type, and discount value are required.' });
      return;
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      res.status(400).json({ error: 'Coupon code already exists.' });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    res.status(201).json({ message: 'Coupon created successfully.', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon.' });
  }
}

export async function editCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        discountType: discountType || coupon.discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : coupon.discountValue,
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : coupon.minOrderValue,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : coupon.maxDiscount,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : coupon.expiryDate,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : coupon.usageLimit,
        isActive: isActive !== undefined ? !!isActive : coupon.isActive,
      },
    });

    res.status(200).json({ message: 'Coupon updated successfully.', coupon: updated });
  } catch (error) {
    console.error('Edit coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon.' });
  }
}

export async function deleteCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon.' });
  }
}

// 5. Customers viewer
export async function getAdminCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'customer' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
}

// 6. Image upload handler (accepts file buffer and pushes to R2 or local fallback)
export async function adminUploadProductImage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file uploaded.' });
      return;
    }

    const imageUrl = await uploadImage(file.buffer, file.originalname, file.mimetype);
    res.status(200).json({ url: imageUrl, imageUrl });
  } catch (error: any) {
    console.error('Admin upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image.' });
  }
}

// 7. Shipping Rules Management
export async function getAdminShippingRules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rules = await prisma.shippingRule.findMany({
      orderBy: { pincode: 'asc' },
    });
    res.status(200).json({ rules });
  } catch (error) {
    console.error('Fetch shipping rules error:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules.' });
  }
}

export async function createShippingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { pincode, shippingCharge } = req.body;

    const trimmedPincode = String(pincode || '').trim();
    if (!trimmedPincode || !/^\d{6}$/.test(trimmedPincode)) {
      res.status(400).json({ error: 'Pincode must be exactly 6 digits.' });
      return;
    }

    const chargeNum = parseFloat(shippingCharge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      res.status(400).json({ error: 'Shipping charge must be a valid number greater than or equal to 0.' });
      return;
    }

    const existing = await prisma.shippingRule.findUnique({
      where: { pincode: trimmedPincode },
    });

    if (existing) {
      res.status(400).json({ error: `Shipping rule for pincode ${trimmedPincode} already exists.` });
      return;
    }

    const rule = await prisma.shippingRule.create({
      data: {
        pincode: trimmedPincode,
        shippingCharge: chargeNum,
      },
    });

    res.status(201).json({ message: 'Shipping rule created successfully.', rule });
  } catch (error) {
    console.error('Create shipping rule error:', error);
    res.status(500).json({ error: 'Failed to create shipping rule.' });
  }
}

export async function editShippingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { pincode, shippingCharge } = req.body;

    const rule = await prisma.shippingRule.findUnique({ where: { id } });
    if (!rule) {
      res.status(404).json({ error: 'Shipping rule not found.' });
      return;
    }

    const trimmedPincode = pincode !== undefined ? String(pincode).trim() : rule.pincode;
    if (!trimmedPincode || !/^\d{6}$/.test(trimmedPincode)) {
      res.status(400).json({ error: 'Pincode must be exactly 6 digits.' });
      return;
    }

    if (trimmedPincode !== rule.pincode) {
      const existing = await prisma.shippingRule.findFirst({
        where: { pincode: trimmedPincode, id: { not: id } },
      });
      if (existing) {
        res.status(400).json({ error: `Shipping rule for pincode ${trimmedPincode} already exists.` });
        return;
      }
    }

    const chargeNum = shippingCharge !== undefined ? parseFloat(shippingCharge) : rule.shippingCharge;
    if (isNaN(chargeNum) || chargeNum < 0) {
      res.status(400).json({ error: 'Shipping charge must be a valid number greater than or equal to 0.' });
      return;
    }

    const updated = await prisma.shippingRule.update({
      where: { id },
      data: {
        pincode: trimmedPincode,
        shippingCharge: chargeNum,
      },
    });

    res.status(200).json({ message: 'Shipping rule updated successfully.', rule: updated });
  } catch (error) {
    console.error('Edit shipping rule error:', error);
    res.status(500).json({ error: 'Failed to update shipping rule.' });
  }
}

export async function deleteShippingRule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const rule = await prisma.shippingRule.findUnique({ where: { id } });
    if (!rule) {
      res.status(404).json({ error: 'Shipping rule not found.' });
      return;
    }

    await prisma.shippingRule.delete({ where: { id } });

    res.status(200).json({ message: 'Shipping rule deleted successfully.' });
  } catch (error) {
    console.error('Delete shipping rule error:', error);
    res.status(500).json({ error: 'Failed to delete shipping rule.' });
  }
}

