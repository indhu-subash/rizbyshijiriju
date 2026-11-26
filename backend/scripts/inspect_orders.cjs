const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: true,
      },
    });

    console.log('=== CURRENT ORDERS IN DATABASE ===');
    console.log(`Total orders found: ${orders.length}`);
    orders.forEach((o, index) => {
      console.log(`\nOrder #${index + 1}:`);
      console.log(`  Order ID: ${o.orderId}`);
      console.log(`  Created At: ${o.createdAt}`);
      console.log(`  Status: ${o.orderStatus} | Payment: ${o.paymentStatus}`);
      console.log(`  Customer: ${o.shippingName} (${o.shippingPhone})`);
      console.log(`  Email: ${o.shippingEmail || 'N/A'}`);
      console.log(`  Delivery: ${o.shippingCity}, ${o.shippingState} - ${o.shippingPincode}`);
      console.log(`  Total: ₹${o.total} (Subtotal: ₹${o.subtotal}, Shipping: ₹${o.shippingCharge}, Discount: ₹${o.discount})`);
      console.log(`  Items (${o.items.length}):`);
      o.items.forEach((item) => {
        console.log(`    - ${item.name} x ${item.quantity} [Restored: ${item.inventoryRestored}]`);
      });
    });

    console.log('\n=== CURRENT BESTSELLERS IN DATABASE ===');
    const bestsellers = await prisma.product.findMany({
      where: { bestseller: true },
      select: { id: true, name: true, price: true, stock: true, bestseller: true },
    });
    console.log(`Total bestsellers: ${bestsellers.length}`);
    bestsellers.forEach((b) => {
      console.log(`  * ${b.name} (Stock: ${b.stock}, Price: ₹${b.price})`);
    });

    console.log('\n=== SHIPPING RULES IN DATABASE ===');
    const shippingRules = await prisma.shippingRule.findMany();
    console.log(`Total shipping rules: ${shippingRules.length}`);
    shippingRules.forEach((r) => {
      console.log(`  * Pincode: ${r.pincode} -> Charge: ₹${r.shippingCharge}`);
    });

  } catch (err) {
    console.error('Error querying orders:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
