import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateShipping, calculateIndiaShipping } from '../services/shippingService';

export async function getUserOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
}

export async function getOrderDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user!.id },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error('Fetch order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
}

export async function trackOrder(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderId: orderId.toUpperCase() },
      select: {
        orderId: true,
        orderStatus: true,
        paymentStatus: true,
        shippingName: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            name: true,
            quantity: true,
            color: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order.' });
  }
}

export async function checkPincodeShipping(req: Request, res: Response): Promise<void> {
  try {
    const { pincode } = req.params;

    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
      res.status(400).json({ error: 'Please enter a valid 6-digit pincode.' });
      return;
    }

    const result = await calculateIndiaShipping(pincode);

    if (!result.available) {
      res.status(200).json({
        available: false,
        pincode,
        error: result.error || 'Delivery unavailable for this pincode.',
      });
      return;
    }

    res.status(200).json({
      available: true,
      pincode,
      shippingCharge: result.shippingCharge,
      estimate: result.estimate,
      city: result.destination.city,
      district: result.destination.district,
      state: result.destination.state,
      source: result.source,
    });
  } catch (error) {
    console.error('Check pincode error:', error);
    res.status(500).json({ error: 'Failed to check pincode availability.' });
  }
}

export async function calculateShippingEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { country, pincode, postalCode, city, state, district } = req.body;
    const result = await calculateShipping({
      country,
      pincode,
      postalCode,
      city,
      state,
      district,
    });

    if (!result.available) {
      res.status(200).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Calculate shipping error:', error);
    res.status(500).json({ error: 'Failed to calculate shipping rate.' });
  }
}
