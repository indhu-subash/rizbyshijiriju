import { Request, Response } from 'express';
import prisma from '../config/db';

export async function getPublicCoupons(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: { isActive: true },
      select: {
        code: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        maxDiscount: true,
        expiryDate: true,
        usageLimit: true,
        usedCount: true,
      },
    });

    const publicCoupons = coupons
      .filter((coupon: any) => {
        const notExpired =
          !coupon.expiryDate || coupon.expiryDate > now;

        const usageAvailable =
          coupon.usageLimit === null ||
          coupon.usedCount < coupon.usageLimit;

        return notExpired && usageAvailable;
      })
      .map((coupon: any) => ({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        expiryDate: coupon.expiryDate,
      }));

    res.status(200).json({ coupons: publicCoupons });
  } catch (error) {
    console.error('Error fetching public coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
}

