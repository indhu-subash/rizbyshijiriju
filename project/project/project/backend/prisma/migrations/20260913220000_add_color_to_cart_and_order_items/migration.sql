-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "color" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "color" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "CartItem_userId_productId_key";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_color_key" ON "CartItem"("userId", "productId", "color");
