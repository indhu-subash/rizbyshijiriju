-- Additive Migration: Colour-Wise Inventory Variants & Order Restoration Safeguards
-- Safe, non-destructive migration preserving all legacy products and existing stock.

-- 1. Add productType and hasVariants to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productType" TEXT DEFAULT 'regular';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hasVariants" BOOLEAN NOT NULL DEFAULT false;

-- 2. Create ProductSize table if not exists (for ring/bangle compatibility)
CREATE TABLE IF NOT EXISTS "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ProductSize_productId_size_key') THEN
        CREATE UNIQUE INDEX "ProductSize_productId_size_key" ON "ProductSize"("productId", "size");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductSize_productId_fkey') THEN
        ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Create ProductVariant table
CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "variantKey" TEXT NOT NULL,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ProductVariant_variantKey_key') THEN
        CREATE UNIQUE INDEX "ProductVariant_variantKey_key" ON "ProductVariant"("variantKey");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ProductVariant_productId_idx') THEN
        CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey') THEN
        ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Add variant and restoration tracking fields to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "inventoryRestored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "restoredAt" TIMESTAMP(3);
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "restorationStatus" TEXT;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_variantId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Add size and variantId to CartItem
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
