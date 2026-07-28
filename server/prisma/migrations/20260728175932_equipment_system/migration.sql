-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');

-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON', 'HELMET', 'ARMOR', 'BOOTS', 'NECKLACE', 'RING', 'ARTIFACT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemType" ADD VALUE 'HELMET';
ALTER TYPE "ItemType" ADD VALUE 'BOOTS';
ALTER TYPE "ItemType" ADD VALUE 'NECKLACE';
ALTER TYPE "ItemType" ADD VALUE 'RING';
ALTER TYPE "ItemType" ADD VALUE 'ARTIFACT';

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "baseAgility" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "baseAttack" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "baseCritRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
ADD COLUMN     "baseDefense" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "baseEvasion" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN     "baseMaxHealth" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "basePower" INTEGER NOT NULL DEFAULT 10;

-- Preserve every existing character's current stats as their new base stats.
UPDATE "Character"
SET
    "baseAttack" = "attack",
    "baseDefense" = "defense",
    "baseMaxHealth" = "maxHealth",
    "baseCritRate" = "critRate",
    "baseEvasion" = "evasion",
    "baseAgility" = "agility",
    "basePower" = "power";

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "slot" "EquipmentSlot";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "agilityBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "attackBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "critBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "defenseBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "evasionBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "healthBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "powerBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rarity" "ItemRarity" NOT NULL DEFAULT 'COMMON';

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_characterId_slot_key" ON "InventoryItem"("characterId", "slot");
