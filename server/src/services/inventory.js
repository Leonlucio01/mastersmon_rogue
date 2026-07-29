export const STACKABLE_ITEM_TYPES = new Set([
  'CONSUMABLE',
  'MATERIAL',
  'QUEST',
])

export function isStackableItem(item) {
  return STACKABLE_ITEM_TYPES.has(item.type)
}

export function getInventoryStackKey(characterId, itemId) {
  return `${characterId}:${itemId}`
}

export async function addItemToInventory(
  characterId,
  item,
  quantity = 1,
  client,
) {
  const safeQuantity = Math.max(1, Math.floor(quantity))

  if (isStackableItem(item)) {
    return [
      await client.inventoryItem.upsert({
        where: {
          stackKey: getInventoryStackKey(characterId, item.id),
        },
        update: { quantity: { increment: safeQuantity } },
        create: {
          characterId,
          itemId: item.id,
          stackKey: getInventoryStackKey(characterId, item.id),
          quantity: safeQuantity,
        },
      }),
    ]
  }

  const entries = []
  for (let index = 0; index < safeQuantity; index += 1) {
    entries.push(
      await client.inventoryItem.create({
        data: {
          characterId,
          itemId: item.id,
          quantity: 1,
        },
      }),
    )
  }
  return entries
}
