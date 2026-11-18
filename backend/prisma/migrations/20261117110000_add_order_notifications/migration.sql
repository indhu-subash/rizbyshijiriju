-- Additive migration: creates a new standalone table only.
-- No existing table, column, index or row is altered or removed.

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderNotification" (
    "id" TEXT NOT NULL,
    "orderRef" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (one notification per order per channel - the idempotency guarantee)
CREATE UNIQUE INDEX IF NOT EXISTS "OrderNotification_orderRef_channel_key" ON "OrderNotification"("orderRef", "channel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderNotification_status_nextAttemptAt_idx" ON "OrderNotification"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderNotification_orderRef_idx" ON "OrderNotification"("orderRef");
