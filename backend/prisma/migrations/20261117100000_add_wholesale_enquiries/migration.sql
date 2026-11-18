-- Additive migration: creates a new standalone table only.
-- No existing table, column, index or row is altered or removed.

-- CreateTable
CREATE TABLE IF NOT EXISTS "WholesaleEnquiry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "estimatedQuantity" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WholesaleEnquiry_status_createdAt_idx" ON "WholesaleEnquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WholesaleEnquiry_email_createdAt_idx" ON "WholesaleEnquiry"("email", "createdAt");
