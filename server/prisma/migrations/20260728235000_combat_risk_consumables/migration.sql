-- AlterTable
ALTER TABLE "BattleLog" ADD COLUMN     "enemyDamage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playerDefeated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playerEvaded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "healAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Monster" ADD COLUMN     "attack" INTEGER NOT NULL DEFAULT 1;

-- Preserve the existing monster damage values.
UPDATE "Monster" SET "attack" = "power";
