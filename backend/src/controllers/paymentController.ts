import { Response } from 'express';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateShipping, isIndiaCountry } from '../services/shippingService';
import { sendOrderConfirmationEmail, sendOrderConfirmationWhatsApp } from '../services/notificationService';
import { findProductBySlugOrId } from './productController';


const PAYMENT_MODE = (process.env.PAYMENT_MODE || 'razorpay').toLowerCase();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpay: Razorpay | null = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
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

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.addressLine ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.phone ||
      !shippingAddress.email
    ) {
      res.status(400).json({ error: 'Complete shipping address is required.' });
      return;
    }

    const country = shippingAddress.country || 'India';
    const isIndia = isIndiaCountry(country);
    const postalOrPincode = String(shippingAddress.pincode || shippingAddress.postalCode || '').trim();

    if (isIndia && (!postalOrPincode || postalOrPincode.length !== 6 || isNaN(Number(postalOrPincode)))) {
      res.status(400).json({ error: 'Valid 6-digit Indian pincode is required.' });
      return;
    }

    if (!isIndia && !postalOrPincode) {
      res.status(400).json({ error: 'Postal / ZIP code is required for international shipping.' });
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
      let product = await findProductBySlugOrId(item.productId, true);

      if (!product) {
        // Check if product exists but is inactive
        const inactiveProduct = await findProductBySlugOrId(item.productId, false);
        if (inactiveProduct) {
          res.status(404).json({ error: `Product ${item.name || item.productId} is currently inactive.` });
          return;
        }
        res.status(404).json({ error: `Product ${item.name || item.productId} is no longer available.` });
        return;
      }

      if (product.stock === 0) {
        res.status(400).json({ error: `Product ${product.name} is out of stock.` });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} items left.` });
        return;
      }

      // Validate colour selection against product.colors array (case-insensitive)
      if (Array.isArray(product.colors) && product.colors.length > 0) {
        const validColorsLower = product.colors.map((c) => c.toLowerCase().trim());
        const selectedColorLower = (item.color || '').toLowerCase().trim();
        if (!item.color || !validColorsLower.includes(selectedColorLower)) {
          res.status(400).json({
            error: `Please select a valid colour for ${product.name}. Available colours: ${product.colors.join(', ')}`,
          });
          return;
        }
      }


      subtotal += product.price * item.quantity;
      checkoutItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        color: item.color || null,
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

    // 3. Authoritative Server-Side Shipping Calculation
    const discountedSubtotal = subtotal - discount;
    let shippingCharge = 0;

    if (isIndia) {
      // India orders: qualify for free shipping if discounted subtotal >= ₹2000
      if (discountedSubtotal >= 2000) {
        shippingCharge = 0;
      } else {
        const shippingRes = await calculateShipping({
          country: 'IN',
          pincode: postalOrPincode,
        });

        if (!shippingRes.available) {
          res.status(400).json({
            error: shippingRes.error || `Delivery is unavailable for pincode ${postalOrPincode}.`,
          });
          return;
        }

        shippingCharge = shippingRes.shippingCharge;
      }
    } else {
      // International orders: DO NOT automatically apply India's ₹2000 free-shipping rule
      const shippingRes = await calculateShipping({
        country,
        postalCode: postalOrPincode,
        city: shippingAddress.city,
        state: shippingAddress.state,
      });

      if (!shippingRes.available) {
        res.status(400).json({
          error: shippingRes.error || `International delivery is currently unavailable to ${country}.`,
        });
        return;
      }

      shippingCharge = shippingRes.shippingCharge;
    }

    const total = Math.max(0, discountedSubtotal + shippingCharge);
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
          userId: req.user?.id || null,
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
          shippingPincode: postalOrPincode,
          shippingCountry: country,
          items: {
            create: checkoutItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              color: item.color,
              image: item.image,
            })),
          },
        },
      });

      return newOrder;
    });

    // 5. Razorpay Integration
    if (paymentMethod !== 'cod') {
      if (PAYMENT_MODE === 'razorpay') {
        if (!razorpay || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
          res.status(500).json({ error: 'Razorpay payment gateway configuration missing on backend (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET required).' });
          return;
        }

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
          throw new Error('Razorpay integration error. Order could not be initialized.');
        }
      }

      // Explicit Mock Mode for local development only if process.env.PAYMENT_MODE === 'mock'
      if (PAYMENT_MODE === 'mock') {
        res.status(201).json({
          message: 'Checkout initialized in mock payment mode.',
          paymentMode: 'mock',
          order: result,
        });
        return;
      }
    }

    // 6. Cash on Delivery (COD) fallback
    res.status(201).json({
      message: 'Order placed successfully.',
      paymentMode: 'cod',
      order: result,
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during checkout.' });
  }
}

export async function cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Only cancel if payment is still pending/unpaid
    if (order.paymentStatus === 'pending' || order.orderStatus === 'Pending') {
      await prisma.$transaction(async (tx: any) => {
        // Mark order as cancelled
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'cancelled',
            orderStatus: 'Cancelled',
          },
        });

        // Restore product stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });

      console.log(`[Order Cancelled] Order #${order.orderId} marked as Cancelled and inventory restored.`);
      res.status(200).json({ message: 'Order cancelled successfully and stock restored.', orderId: order.orderId });
      return;
    }

    res.status(200).json({ message: 'Order is already processed.', orderId: order.orderId });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order.' });
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
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // STRICT GUARD: Rejects verification if order is already Cancelled
    if (order.orderStatus === 'Cancelled' || order.paymentStatus === 'cancelled') {
      res.status(400).json({ error: 'Order has already been cancelled and cannot be confirmed.' });
      return;
    }

    // Helper to confirm order atomically and trigger Email + WhatsApp notifications
    const confirmAndNotifyOrder = async (payId: string, rzpOrdId?: string) => {
      const updateResult = await prisma.order.updateMany({
        where: {
          id: order.id,
          orderStatus: 'Pending',
        },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'Confirmed',
          paymentId: payId,
          ...(rzpOrdId ? { razorpayOrderId: rzpOrdId } : {}),
        },
      });

      if (updateResult.count === 0) {
        // Idempotent recovery: If order was ALREADY confirmed (e.g. by webhook or prior verify call)
        const existingOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });

        if (existingOrder && (existingOrder.orderStatus === 'Confirmed' || existingOrder.paymentStatus === 'paid')) {
          if (!existingOrder.paymentId && payId) {
            await prisma.order.update({
              where: { id: existingOrder.id },
              data: { paymentId: payId, ...(rzpOrdId ? { razorpayOrderId: rzpOrdId } : {}) },
            });
          }
          return existingOrder;
        }

        throw new Error('Order is not in pending status and cannot be confirmed.');
      }

      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (updatedOrder) {
        sendOrderConfirmationEmail(updatedOrder).catch((e) => console.error('Email error:', e));
        sendOrderConfirmationWhatsApp(updatedOrder).catch((e) => console.error('WhatsApp error:', e));
      }

      return updatedOrder;
    };

    // 1. Verify Mock Payment
    if (order.paymentMethod !== 'cod' && PAYMENT_MODE === 'mock') {
      await confirmAndNotifyOrder(`MOCK_PAY_${Date.now()}`);
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

      // Check razorpayOrderId matches order.razorpayOrderId if present
      if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
        res.status(400).json({ error: 'Razorpay order ID mismatch.' });
        return;
      }

      const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        // Mark payment as failed & restore stock atomically ONLY if order is still Pending
        if (order.orderStatus === 'Pending') {
          await prisma.$transaction(async (tx: any) => {
            await tx.order.updateMany({
              where: { id: order.id, orderStatus: 'Pending' },
              data: { paymentStatus: 'failed', orderStatus: 'Cancelled' },
            });

            for (const item of order.items) {
              if (item.productId) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          });
        }

        res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
        return;
      }

      await confirmAndNotifyOrder(razorpayPaymentId, razorpayOrderId);

      res.status(200).json({
        message: 'Razorpay payment verified successfully.',
        orderId: order.orderId,
      });
      return;
    }

    res.status(400).json({ error: 'Payment mode mismatch or keys missing.' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment.' });
  }
}

export async function handleRazorpayWebhook(req: any, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        res.status(400).json({ error: 'Invalid webhook signature.' });
        return;
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload?.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { razorpayOrderId: razorpayOrderId },
              { orderId: paymentEntity?.notes?.orderId || orderEntity?.receipt || '' },
            ],
          },
          include: { items: true },
        });

        if (order && order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'cancelled') {
          if (order.orderStatus === 'Pending') {
            const updateResult = await prisma.order.updateMany({
              where: { id: order.id, orderStatus: 'Pending' },
              data: {
                paymentStatus: 'paid',
                orderStatus: 'Confirmed',
                paymentId: razorpayPaymentId || order.paymentId,
                razorpayOrderId: razorpayOrderId,
              },
            });

            if (updateResult.count > 0) {
              const updated = await prisma.order.findUnique({
                where: { id: order.id },
                include: { items: true },
              });
              if (updated) {
                sendOrderConfirmationEmail(updated).catch((e) => console.error('Email error:', e));
                sendOrderConfirmationWhatsApp(updated).catch((e) => console.error('WhatsApp error:', e));
              }
            }
          } else if (order.orderStatus === 'Confirmed' || order.paymentStatus === 'paid') {
            // Idempotent webhook receipt for already confirmed order
            if (!order.paymentId && razorpayPaymentId) {
              await prisma.order.update({
                where: { id: order.id },
                data: { paymentId: razorpayPaymentId, razorpayOrderId: razorpayOrderId },
              });
            }
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

export async function cancelPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required for cancellation.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Rejects cancellation if order was already confirmed / paid
    if (order.paymentStatus === 'paid' || order.orderStatus === 'Confirmed') {
      res.status(400).json({ error: 'Cannot cancel a verified and paid order.' });
      return;
    }

    // Idempotency check: If order is ALREADY cancelled, return success without restoring stock again
    if (order.orderStatus === 'Cancelled' || order.paymentStatus === 'cancelled') {
      res.status(200).json({
        message: 'Order is already cancelled.',
        orderId: order.orderId,
      });
      return;
    }

    // Perform cancellation transaction: update order status + idempotently restore stock + adjust coupon usage
    await prisma.$transaction(async (tx: any) => {
      const cancelResult = await tx.order.updateMany({
        where: { id: order.id, orderStatus: 'Pending' },
        data: {
          orderStatus: 'Cancelled',
          paymentStatus: 'cancelled',
        },
      });

      if (cancelResult.count > 0) {
        // Restore stock for each item in the order
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }

        // Decrement coupon usage if applied
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode.toUpperCase(), usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }
    });

    res.status(200).json({
      message: 'Order cancelled successfully and inventory restored.',
      orderId: order.orderId,
    });
  } catch (error: any) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
}


