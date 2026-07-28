-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "currentMonsterOrder" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Monster" ADD COLUMN     "isBoss" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "initiallyUnlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiredLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiredPower" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CharacterProgress" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "currentMonsterOrder" INTEGER NOT NULL DEFAULT 1,
    "currentMonsterHealth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterProgress_characterId_unlocked_idx" ON "CharacterProgress"("characterId", "unlocked");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProgress_characterId_zoneId_key" ON "CharacterProgress"("characterId", "zoneId");

-- AddForeignKey
ALTER TABLE "CharacterProgress" ADD CONSTRAINT "CharacterProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProgress" ADD CONSTRAINT "CharacterProgress_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
