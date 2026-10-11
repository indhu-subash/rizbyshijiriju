import prisma from '../config/db';

export interface InventoryItemRequest {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  name?: string;
  price?: number;
  productCode?: string | null;
  image?: string;
}

export interface PreparedOrderItem {
  productId: string;
  productCode: string | null;
  name: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  variantId: string | null;
  image: string;
}

export interface RestorationOutcome {
  success: boolean;
  restoredCount: number;
  alreadyRestored: boolean;
  details: Array<{
    itemId: string;
    productName: string;
    status: string;
    restoredQuantity: number;
  }>;
}

/**
 * Resolves a ProductVariant by color and size in a case-insensitive manner.
 */
export async function resolveProductVariant(
  tx: any,
  productId: string,
  color?: string | null,
  size?: string | null
) {
  const variants = await tx.productVariant.findMany({
    where: { productId },
  });

  if (!variants || variants.length === 0) {
    return null;
  }

  const normalizedColor = color ? color.trim().toLowerCase() : null;
  const normalizedSize = size ? size.trim().toLowerCase() : null;

  return variants.find((v: any) => {
    const vColor = v.color ? v.color.trim().toLowerCase() : null;
    const vSize = v.size ? v.size.trim().toLowerCase() : null;

    if (normalizedColor && normalizedSize) {
      return vColor === normalizedColor && vSize === normalizedSize;
    }
    if (normalizedColor && !normalizedSize) {
      return vColor === normalizedColor && !vSize;
    }
    if (!normalizedColor && normalizedSize) {
      return !vColor && vSize === normalizedSize;
    }
    return !vColor && !vSize;
  }) || null;
}

/**
 * Concurrency-safe atomic deduction of product and variant inventory during checkout.
 * Runs inside an active Prisma transaction.
 */
export async function deductOrderStock(
  tx: any,
  items: InventoryItemRequest[]
): Promise<PreparedOrderItem[]> {
  const preparedItems: PreparedOrderItem[] = [];

  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: true,
        sizes: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${item.name || item.productId} is no longer available.`);
    }

    if (!product.isActive) {
      throw new Error(`Product ${product.name} is currently inactive.`);
    }

    const requestedQty = Number(item.quantity);
    if (requestedQty <= 0) {
      throw new Error(`Invalid quantity ${requestedQty} for ${product.name}.`);
    }

    if (product.hasVariants) {
      // 1. Variant-based product: authoritatively track at the variant level
      const matchingVariant = await resolveProductVariant(
        tx,
        product.id,
        item.color,
        item.size
      );

      if (!matchingVariant) {
        const variantDesc = [item.color, item.size].filter(Boolean).join(' / ') || 'standard';
        throw new Error(
          `Selected variant (${variantDesc}) for product "${product.name}" is not available.`
        );
      }

      if (matchingVariant.stock < requestedQty) {
        const variantDesc = [item.color, item.size].filter(Boolean).join(' / ') || 'standard';
        throw new Error(
          `Insufficient stock for "${product.name}" (${variantDesc}). Only ${matchingVariant.stock} left in stock.`
        );
      }

      // Concurrency check on variant stock
      const updatedVariant = await tx.productVariant.updateMany({
        where: {
          id: matchingVariant.id,
          stock: { gte: requestedQty },
        },
        data: {
          stock: { decrement: requestedQty },
        },
      });

      if (updatedVariant.count === 0) {
        throw new Error(
          `Stock changed concurrently for "${product.name}". Please review your cart and try again.`
        );
      }

      // Synchronize product.stock (authoritatively equal to the sum of all variant stocks)
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: requestedQty },
        },
      });

      // If sized product has matching ProductSize, also synchronize ProductSize
      if (matchingVariant.size) {
        await tx.productSize.updateMany({
          where: {
            productId: product.id,
            size: matchingVariant.size,
          },
          data: {
            stock: { decrement: requestedQty },
          },
        });
      }

      preparedItems.push({
        productId: product.id,
        productCode: product.productCode || null,
        name: product.name,
        price: product.price,
        quantity: requestedQty,
        color: item.color || matchingVariant.color || null,
        size: item.size || matchingVariant.size || null,
        variantId: matchingVariant.id,
        image: item.image || (product.images && product.images[0]) || '',
      });
    } else {
      // 2. Legacy product: authoritative product.stock
      if (product.stock < requestedQty) {
        throw new Error(
          `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`
        );
      }

      const updatedProduct = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: requestedQty },
        },
        data: {
          stock: { decrement: requestedQty },
        },
      });

      if (updatedProduct.count === 0) {
        throw new Error(
          `Stock changed concurrently for "${product.name}". Please review your cart and try again.`
        );
      }

      // If legacy sized product (ring / bangle), also update ProductSize
      if (item.size) {
        await tx.productSize.updateMany({
          where: {
            productId: product.id,
            size: item.size,
          },
          data: {
            stock: { decrement: requestedQty },
          },
        });
      }

      preparedItems.push({
        productId: product.id,
        productCode: product.productCode || null,
        name: product.name,
        price: product.price,
        quantity: requestedQty,
        color: item.color || null,
        size: item.size || null,
        variantId: null,
        image: item.image || (product.images && product.images[0]) || '',
      });
    }
  }

  return preparedItems;
}

/**
 * Concurrency-safe, atomic, and idempotent stock restoration for order cancellations and refunds.
 * Must be executed within a Prisma transaction (tx).
 */
export async function restoreOrderInventory(
  tx: any,
  orderId: string,
  options?: { reason?: string }
): Promise<RestorationOutcome> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order #${orderId} not found for inventory restoration.`);
  }

  const unbondedItems = order.items.filter((item: any) => !item.inventoryRestored);

  if (unbondedItems.length === 0) {
    return {
      success: true,
      restoredCount: 0,
      alreadyRestored: true,
      details: order.items.map((it: any) => ({
        itemId: it.id,
        productName: it.name,
        status: it.restorationStatus || 'ALREADY_RESTORED',
        restoredQuantity: 0,
      })),
    };
  }

  const outcomes: Array<{
    itemId: string;
    productName: string;
    status: string;
    restoredQuantity: number;
  }> = [];

  for (const item of unbondedItems) {
    // Case 1: Product was deleted or productId is null
    if (!item.productId) {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryRestored: false,
          restoredAt: new Date(),
          restorationStatus: 'DELETED_PRODUCT_RECONCILED',
        },
      });
      outcomes.push({
        itemId: item.id,
        productName: item.name,
        status: 'DELETED_PRODUCT_RECONCILED',
        restoredQuantity: 0,
      });
      continue;
    }

    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });

    if (!product) {
      // Product no longer exists in DB
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryRestored: false,
          restoredAt: new Date(),
          restorationStatus: 'DELETED_PRODUCT_RECONCILED',
        },
      });
      outcomes.push({
        itemId: item.id,
        productName: item.name,
        status: 'DELETED_PRODUCT_RECONCILED',
        restoredQuantity: 0,
      });
      continue;
    }

    // Case 2: Order item has an explicit variantId
    if (item.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant) {
        // Safety requirement: Abort transaction if required variant is missing; NEVER fall back to Product.stock!
        throw new Error(
          `Inconsistency detected: Variant #${item.variantId} for order item "${item.name}" was not found. Transaction aborted to prevent incorrect stock restoration.`
        );
      }

      // Atomically restore variant stock and product stock
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: { increment: item.quantity },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { increment: item.quantity },
        },
      });

      if (variant.size) {
        await tx.productSize.updateMany({
          where: {
            productId: product.id,
            size: variant.size,
          },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryRestored: true,
          restoredAt: new Date(),
          restorationStatus: 'RESTORED',
        },
      });

      outcomes.push({
        itemId: item.id,
        productName: item.name,
        status: 'RESTORED',
        restoredQuantity: item.quantity,
      });
      continue;
    }

    // Case 3: Legacy order item without variantId
    if (product.hasVariants) {
      // The product has transitioned to variant mode since the legacy order was placed.
      // Attempt to resolve variant target by color and size.
      const resolvedVariant = await resolveProductVariant(
        tx,
        product.id,
        item.color,
        item.size
      );

      if (!resolvedVariant) {
        // Safety requirement: Never fall back to Product.stock when a variant-based product's variant cannot be resolved.
        throw new Error(
          `Cannot restore legacy order item "${item.name}": Product is now in variant mode but no matching variant was found for color "${item.color || ''}" / size "${item.size || ''}". Transaction aborted for manual reconciliation.`
        );
      }

      await tx.productVariant.update({
        where: { id: resolvedVariant.id },
        data: {
          stock: { increment: item.quantity },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { increment: item.quantity },
        },
      });

      if (resolvedVariant.size) {
        await tx.productSize.updateMany({
          where: {
            productId: product.id,
            size: resolvedVariant.size,
          },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryRestored: true,
          restoredAt: new Date(),
          restorationStatus: 'RESTORED',
        },
      });

      outcomes.push({
        itemId: item.id,
        productName: item.name,
        status: 'RESTORED',
        restoredQuantity: item.quantity,
      });
    } else {
      // Standard legacy restoration
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { increment: item.quantity },
        },
      });

      if (item.size) {
        await tx.productSize.updateMany({
          where: {
            productId: product.id,
            size: item.size,
          },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryRestored: true,
          restoredAt: new Date(),
          restorationStatus: 'RESTORED',
        },
      });

      outcomes.push({
        itemId: item.id,
        productName: item.name,
        status: 'RESTORED',
        restoredQuantity: item.quantity,
      });
    }
  }

  const restoredCount = outcomes.filter((o) => o.status === 'RESTORED').length;

  return {
    success: true,
    restoredCount,
    alreadyRestored: false,
    details: outcomes,
  };
}
