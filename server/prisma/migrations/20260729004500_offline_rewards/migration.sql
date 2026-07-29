-- CreateEnum
CREATE TYPE "OfflineRewardStatus" AS ENUM ('PENDING', 'CLAIMED');

-- AlterTable
ALTER TABLE "Character"
ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "OfflineReward" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "pendingKey" TEXT,
    "zoneName" TEXT NOT NULL,
    "offlineStartedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "offlineSeconds" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,
    "drops" JSONB NOT NULL,
    "limitApplied" BOOLEAN NOT NULL DEFAULT false,
    "status" "OfflineRewardStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfflineReward_pendingKey_key"
ON "OfflineReward"("pendingKey");

-- CreateIndex
CREATE INDEX "OfflineReward_characterId_status_idx"
ON "OfflineReward"("characterId", "status");

-- CreateIndex
CREATE INDEX "OfflineReward_characterId_calculatedAt_idx"
ON "OfflineReward"("characterId", "calculatedAt");

-- AddForeignKey
ALTER TABLE "OfflineReward"
ADD CONSTRAINT "OfflineReward_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "Character"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
