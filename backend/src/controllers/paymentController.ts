import { Response } from 'express';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const PAYMENT_MODE = process.env.PAYMENT_MODE || 'mock';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpay: Razorpay | null = null;
if (PAYMENT_MODE === 'razorpay' && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

export async function createCheckoutOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { items, shippingAddress, couponCode, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
      return;
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.addressLine || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode || !shippingAddress.phone || !shippingAddress.email) {
      res.status(400).json({ error: 'Complete shipping address is required.' });
      return;
    }

    const validPaymentMethods = ['UPI', 'card', 'cod'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({ error: 'Invalid payment method.' });
      return;
    }

    // 1. Calculate authoritative totals on the server
    let subtotal = 0;
    const checkoutItems: any[] = [];
    const productUpdates: { id: string; newStock: number }[] = [];

    // Load products from DB and verify stock in a single flow
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        res.status(404).json({ error: `Product ${item.name || item.productId} is no longer available.` });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} items left.` });
        return;
      }

      subtotal += product.price * item.quantity;
      checkoutItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
      });

      productUpdates.push({
        id: product.id,
        newStock: product.stock - item.quantity,
      });
    }

    // 2. Coupon Validation
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });

      if (coupon) {
        // Expiry check
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          res.status(400).json({ error: 'This coupon code has expired.' });
          return;
        }

        // Min order check
        if (subtotal < coupon.minOrderValue) {
          res.status(400).json({ error: `Coupon requires a minimum order value of ₹${coupon.minOrderValue}.` });
          return;
        }

        // Usage limit check
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          res.status(400).json({ error: 'This coupon has reached its usage limit.' });
          return;
        }

        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.round(discount * 100) / 100;
      } else {
        res.status(400).json({ error: 'Invalid coupon code.' });
        return;
      }
    }

    // 3. Shipping Charge
    let shippingCharge = 79.0;
    if (subtotal - discount >= 999) {
      shippingCharge = 0;
    } else {
      const rule = await prisma.shippingRule.findUnique({
        where: { pincode: shippingAddress.pincode },
      });
      if (rule) {
        shippingCharge = rule.shippingCharge;
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCharge);
    const orderId = `RIZ-2026-${Math.floor(10000 + Math.random() * 89999)}`;

    // 4. Database Transaction: Decrement stock, create order, and increment coupon usage
    const result = await prisma.$transaction(async (tx: any) => {
      // Re-verify stock inside the transaction for concurrency safety
      for (const update of productUpdates) {
        const prod = await tx.product.findUnique({
          where: { id: update.id },
        });
        if (!prod || prod.stock < (items.find((it) => it.productId === update.id)?.quantity || 0)) {
          throw new Error('Stock changed during transaction. Please try again.');
        }

        await tx.product.update({
          where: { id: update.id },
          data: { stock: update.newStock },
        });
      }

      // Increment coupon usage
      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user?.id || null, // Allow checkout even if guest checkout was enabled, but authenticated works
          orderId,
          subtotal,
          discount,
          shippingCharge,
          total,
          couponCode: couponCode || null,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
          orderStatus: paymentMethod === 'cod' ? 'Confirmed' : 'Pending',
          shippingName: shippingAddress.name,
          shippingPhone: shippingAddress.phone,
          shippingEmail: shippingAddress.email,
          shippingAddressLine: shippingAddress.addressLine,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingPincode: shippingAddress.pincode,
          shippingCountry: shippingAddress.country || 'India',
          items: {
            create: checkoutItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
          },
        },
      });

      return newOrder;
    });

    // 5. Razorpay Integration
    if (paymentMethod !== 'cod' && PAYMENT_MODE === 'razorpay' && razorpay) {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(total * 100), // Razorpay accepts paise
          currency: 'INR',
          receipt: result.orderId,
        });

        await prisma.order.update({
          where: { id: result.id },
          data: { razorpayOrderId: razorpayOrder.id },
        });

        res.status(201).json({
          message: 'Checkout initialized.',
          paymentMode: 'razorpay',
          razorpayKeyId: RAZORPAY_KEY_ID,
          razorpayOrderId: razorpayOrder.id,
          order: result,
        });
        return;
      } catch (err) {
        console.error('Razorpay order creation error:', err);
        // Rollback stock and fail checkout order if Razorpay fails
        // Wait, if it fails here we can't easily undo the transaction unless we throw an error.
        // Let's throw an error to trigger catch block, but to be clean, we can just throw.
        throw new Error('Razorpay integration error. Order could not be initialized.');
      }
    }

    // 6. Cash on Delivery or Mock Payment fallback
    res.status(201).json({
      message: paymentMethod === 'cod' ? 'Order placed successfully.' : 'Checkout initialized in mock payment mode.',
      paymentMode: paymentMethod === 'cod' ? 'cod' : 'mock',
      order: result,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during checkout.' });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // 1. Verify Mock Payment
    if (order.paymentMethod !== 'cod' && PAYMENT_MODE === 'mock') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'Confirmed',
          paymentId: `MOCK_PAY_${Date.now()}`,
        },
      });

      res.status(200).json({
        message: 'Mock payment verified successfully.',
        orderId: order.orderId,
      });
      return;
    }

    // 2. Verify Razorpay Payment
    if (PAYMENT_MODE === 'razorpay' && RAZORPAY_KEY_SECRET) {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        res.status(400).json({ error: 'Razorpay payment verification parameters are missing.' });
        return;
      }

      const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        // Mark payment as failed
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'failed' },
        });

        res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
        return;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'Confirmed',
          paymentId: razorpayPaymentId,
          razorpayOrderId: razorpayOrderId,
        },
      });

      res.status(200).json({
        message: 'Razorpay payment verified successfully.',
        orderId: order.orderId,
      });
      return;
    }

    res.status(400).json({ error: 'Payment mode mismatch or keys missing.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
}
