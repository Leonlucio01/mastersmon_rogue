-- AlterTable
ALTER TABLE "InventoryItem"
ADD COLUMN "stackKey" TEXT;

-- Preserve independent copies of equipment previously stored as quantity > 1.
INSERT INTO "InventoryItem" (
    "id",
    "quantity",
    "equipped",
    "slot",
    "characterId",
    "itemId",
    "stackKey",
    "createdAt",
    "updatedAt"
)
SELECT
    ii.id || '-copy-' || copies.number,
    1,
    false,
    NULL,
    ii."characterId",
    ii."itemId",
    NULL,
    ii."createdAt",
    CURRENT_TIMESTAMP
FROM "InventoryItem" ii
JOIN "Item" i ON i.id = ii."itemId"
CROSS JOIN LATERAL generate_series(2, ii.quantity) AS copies(number)
WHERE i.type IN (
    'WEAPON',
    'HELMET',
    'ARMOR',
    'BOOTS',
    'NECKLACE',
    'RING',
    'ARTIFACT'
)
AND ii.quantity > 1;

UPDATE "InventoryItem" ii
SET quantity = 1
FROM "Item" i
WHERE i.id = ii."itemId"
AND i.type IN (
    'WEAPON',
    'HELMET',
    'ARMOR',
    'BOOTS',
    'NECKLACE',
    'RING',
    'ARTIFACT'
)
AND ii.quantity > 1;

-- Existing consumables, materials and quest items remain stackable.
UPDATE "InventoryItem" ii
SET "stackKey" = ii."characterId" || ':' || ii."itemId"
FROM "Item" i
WHERE i.id = ii."itemId"
AND i.type IN ('CONSUMABLE', 'MATERIAL', 'QUEST');

-- DropIndex
DROP INDEX "InventoryItem_characterId_itemId_key";

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_stackKey_key"
ON "InventoryItem"("stackKey");

-- CreateIndex
CREATE INDEX "InventoryItem_characterId_itemId_idx"
ON "InventoryItem"("characterId", "itemId");

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "stock" INTEGER,
    "availableFromZoneId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_itemId_key" ON "ShopItem"("itemId");

-- CreateIndex
CREATE INDEX "ShopItem_enabled_sortOrder_idx"
ON "ShopItem"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "ShopItem_availableFromZoneId_idx"
ON "ShopItem"("availableFromZoneId");

-- AddForeignKey
ALTER TABLE "ShopItem"
ADD CONSTRAINT "ShopItem_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem"
ADD CONSTRAINT "ShopItem_availableFromZoneId_fkey"
FOREIGN KEY ("availableFromZoneId") REFERENCES "Zone"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
