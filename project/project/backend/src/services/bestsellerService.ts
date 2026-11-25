import prisma from '../config/db';

/**
 * Synchronizes bestseller status across all products in the database based on actual order volume.
 * Products with confirmed/paid sales are marked bestseller = true.
 * Returns the updated count of bestsellers.
 */
export async function syncBestsellers(): Promise<{ success: boolean; bestsellersCount: number }> {
  try {
    // 1. Fetch all confirmed/paid order items grouped by productId
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: { not: null },
        order: {
          orderStatus: { notIn: ['Cancelled', 'cancelled', 'FAILED', 'failed'] },
          paymentStatus: { in: ['paid', 'Paid', 'PAID', 'SUCCESS', 'success', 'COMPLETED', 'completed'] },
        },
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    const salesMap = new Map<string, number>();
    orderItems.forEach((item) => {
      if (item.productId) {
        const cur = salesMap.get(item.productId) || 0;
        salesMap.set(item.productId, cur + (item.quantity || 1));
      }
    });

    const bestsellerIds = Array.from(salesMap.entries())
      .filter(([_, qty]) => qty > 0)
      .map(([id]) => id);

    if (bestsellerIds.length > 0) {
      // Mark products with sales as bestseller = true
      await prisma.product.updateMany({
        where: { id: { in: bestsellerIds } },
        data: { bestseller: true },
      });

      // Mark products without sales as bestseller = false
      await prisma.product.updateMany({
        where: { id: { notIn: bestsellerIds }, bestseller: true },
        data: { bestseller: false },
      });

      console.log(`[Bestseller Sync] Synced ${bestsellerIds.length} bestsellers based on order sales.`);
      return { success: true, bestsellersCount: bestsellerIds.length };
    } else {
      console.log('[Bestseller Sync] No paid order items found yet; preserving default states.');
      return { success: true, bestsellersCount: 0 };
    }
  } catch (err: any) {
    console.error('[Bestseller Sync Error]:', err?.message || err);
    return { success: false, bestsellersCount: 0 };
  }
}
