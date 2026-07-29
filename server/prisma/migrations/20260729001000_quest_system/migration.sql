-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('MAIN', 'ZONE');

-- CreateEnum
CREATE TYPE "QuestTargetType" AS ENUM ('MONSTER_KILL', 'ZONE_ENTER', 'ZONE_KILL');

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "questType" "QuestType" NOT NULL,
    "targetType" "QuestTargetType" NOT NULL,
    "targetMonsterId" TEXT,
    "targetZoneId" TEXT,
    "requiredAmount" INTEGER NOT NULL DEFAULT 1,
    "rewardGold" INTEGER NOT NULL DEFAULT 0,
    "rewardExp" INTEGER NOT NULL DEFAULT 0,
    "rewardItemId" TEXT,
    "rewardItemQuantity" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMainQuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterQuest" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quest_title_key" ON "Quest"("title");

-- CreateIndex
CREATE INDEX "Quest_targetMonsterId_idx" ON "Quest"("targetMonsterId");

-- CreateIndex
CREATE INDEX "Quest_targetZoneId_idx" ON "Quest"("targetZoneId");

-- CreateIndex
CREATE INDEX "CharacterQuest_characterId_completed_claimed_idx" ON "CharacterQuest"("characterId", "completed", "claimed");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterQuest_characterId_questId_key" ON "CharacterQuest"("characterId", "questId");

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_targetMonsterId_fkey" FOREIGN KEY ("targetMonsterId") REFERENCES "Monster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_targetZoneId_fkey" FOREIGN KEY ("targetZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterQuest" ADD CONSTRAINT "CharacterQuest_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterQuest" ADD CONSTRAINT "CharacterQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
