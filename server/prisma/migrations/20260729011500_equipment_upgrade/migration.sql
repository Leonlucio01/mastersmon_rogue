-- AlterTable
ALTER TABLE "InventoryItem"
ADD COLUMN "upgradeLevel" INTEGER NOT NULL DEFAULT 0;

-- Guard the MVP range at database level as well as in the API.
ALTER TABLE "InventoryItem"
ADD CONSTRAINT "InventoryItem_upgradeLevel_check"
CHECK ("upgradeLevel" >= 0 AND "upgradeLevel" <= 5);
