-- AlterTable: Add productCode to Product if not exists
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productCode" TEXT;

-- AlterTable: Add productCode to OrderItem if not exists
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "productCode" TEXT;

-- CreateIndex: Add unique constraint on Product.productCode if not exists
CREATE UNIQUE INDEX IF NOT EXISTS "Product_productCode_key" ON "Product"("productCode");
