-- Additive migration: creates WholesaleNotification table only.
-- No existing table, column, index or row is altered or removed.

CREATE TABLE IF NOT EXISTS "WholesaleNotification" (
    "id" TEXT NOT NULL,
    "enquiryRef" TEXT NOT NULL,
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

    CONSTRAINT "WholesaleNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WholesaleNotification_enquiryRef_channel_key" ON "WholesaleNotification"("enquiryRef", "channel");
CREATE INDEX IF NOT EXISTS "WholesaleNotification_status_nextAttemptAt_idx" ON "WholesaleNotification"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "WholesaleNotification_enquiryRef_idx" ON "WholesaleNotification"("enquiryRef");
