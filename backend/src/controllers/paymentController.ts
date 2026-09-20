import { Response } from 'express';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateShipping, isIndiaCountry } from '../services/shippingService';

function getRazorpayConfig() {
  const mode = process.env.PAYMENT_MODE || 'razorpay';
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  let rzpInstance: Razorpay | null = null;
  if (keyId && keySecret) {
    rzpInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return { mode, keyId, keySecret, rzpInstance };
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

    const validPaymentMethods = ['UPI', 'card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({ error: 'Invalid payment method. Cash on delivery is not accepted.' });
      return;
    }

    // 1. Calculate authoritative totals on the server
    let subtotal = 0;
    const checkoutItems: any[] = [];
    const productUpdates: { id: string; newStock: number }[] = [];

    const seedSlugs: string[] = [
      'the-quiet-hoop', 'mogra-pearl-drops', 'everyday-gold-studs', 'meera-textured-ring',
      'sona-layered-chain', 'aara-cuff-bracelet', 'luna-shell-hoops', 'nila-signet-ring',
      'maya-mini-hoops', 'kairi-pendant', 'tara-second-studs', 'anaya-dome-earrings',
      'ira-everyday-chain', 'vanya-open-ring', 'ruh-gold-bracelet', 'aria-pearl-pendant',
      'dev-minimal-chain', 'riva-sculptural-hoops', 'kavya-nose-pin', 'asha-temple-drops',
      'nava-stack-ring', 'riz-classic-cuff', 'aadi-signet', 'suhana-chandbali',
      'kaveri-anklet', 'nila-gift-set', 'little-mogra-studs', 'little-riz-bracelet',
      'tiny-star-chain', 'muthu-bridal-set', 'kasavu-jhumka', 'malabar-choker',
      'kerala-bloom-bangle', 'matte-link-chain', 'aranya-pendant', 'sia-limited-drops',
      'riz-mini-hoops', 'veda-bridal-necklace', 'tiny-moon-gift-set', 'kochi-classic-anklet'
    ];

    // Load products from DB and verify stock in a single flow
    for (const item of items) {
      const searchTerms = [item.productId, item.slug].filter(Boolean);
      let product = await prisma.product.findFirst({
        where: {
          OR: searchTerms.flatMap((term) => [{ id: term }, { slug: term }]),
          isActive: true,
        },
      });

      // Fallback: If productId is static format like 'riz-8'
      if (!product && item.productId && item.productId.toLowerCase().startsWith('riz-')) {
        const idx = parseInt(item.productId.toLowerCase().replace('riz-', ''), 10) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < seedSlugs.length) {
          const mappedSlug = seedSlugs[idx];
          product = await prisma.product.findFirst({
            where: { slug: mappedSlug, isActive: true },
          });
        }
      }

      if (!product) {
        res.status(404).json({ error: `Product ${item.name || item.productId} is no longer available.` });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} items left.` });
        return;
      }

      // Validate colour selection against product.colors array
      if (Array.isArray(product.colors) && product.colors.length > 0) {
        if (!item.color || !product.colors.includes(item.color)) {
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
    const { mode, keyId, keySecret, rzpInstance } = getRazorpayConfig();

    if (paymentMethod !== 'cod' && (mode === 'razorpay' || rzpInstance)) {
      if (rzpInstance) {
        try {
          const razorpayOrder = await rzpInstance.orders.create({
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
            razorpayKeyId: keyId,
            razorpayOrderId: razorpayOrder.id,
            order: result,
          });
          return;
        } catch (err: any) {
          console.error('Razorpay order creation error:', err);
          res.status(500).json({ error: err?.message || 'Razorpay integration error. Order could not be initialized.' });
          return;
        }
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

    const { mode, keySecret } = getRazorpayConfig();

    // 1. Verify Razorpay Payment (if signature and payment ID provided)
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const secret = keySecret || process.env.RAZORPAY_KEY_SECRET || '';
      if (secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpaySignature) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'failed' },
          });

          res.status(400).json({ error: 'Invalid Razorpay signature. Payment verification failed.' });
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
    }

    // 2. Verify Mock Payment fallback
    if (order.paymentMethod !== 'cod') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'Confirmed',
          paymentId: `MOCK_PAY_${Date.now()}`,
        },
      });

      res.status(200).json({
        message: 'Payment verified successfully.',
        orderId: order.orderId,
      });
      return;
    }

    res.status(400).json({ error: 'Payment mode mismatch or missing parameters.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
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
        });

        if (order && order.paymentStatus !== 'paid') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'paid',
              orderStatus: 'Confirmed',
              paymentId: razorpayPaymentId || order.paymentId,
              razorpayOrderId: razorpayOrderId,
            },
          });
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}
