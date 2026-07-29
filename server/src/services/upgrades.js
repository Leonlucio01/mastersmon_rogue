import { prisma } from '../lib/prisma.js'
import {
  getEquipmentState,
  recalculateCharacterStats,
} from './equipment.js'
import {
  EQUIPABLE_ITEM_TYPES,
  getNextUpgradeCost,
  getUpgradedItemBonuses,
  isUpgradeableItem,
  MAX_UPGRADE_LEVEL,
} from './equipmentBonuses.js'

function upgradeError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

function serializeUpgradeableItem(entry) {
  const currentLevel = entry.upgradeLevel
  const nextLevel =
    currentLevel < MAX_UPGRADE_LEVEL ? currentLevel + 1 : null

  return {
    inventoryItemId: entry.id,
    itemId: entry.item.id,
    name: entry.item.name,
    displayName:
      currentLevel > 0
        ? `${entry.item.name} +${currentLevel}`
        : entry.item.name,
    description: entry.item.description,
    itemType: entry.item.type.toLowerCase(),
    rarity: entry.item.rarity.toLowerCase(),
    slot: entry.item.type.toLowerCase(),
    equipped: entry.equipped,
    upgradeLevel: currentLevel,
    maxUpgradeLevel: MAX_UPGRADE_LEVEL,
    maxed: currentLevel >= MAX_UPGRADE_LEVEL,
    nextUpgradeCost: getNextUpgradeCost(currentLevel),
    currentStats: getUpgradedItemBonuses(entry.item, currentLevel),
    nextStats:
      nextLevel === null
        ? null
        : getUpgradedItemBonuses(entry.item, nextLevel),
  }
}

export async function getUpgradeState(characterId, client = prisma) {
  const [character, inventory, equipmentState] = await Promise.all([
    client.character.findUnique({ where: { id: characterId } }),
    client.inventoryItem.findMany({
      where: {
        characterId,
        item: { type: { in: [...EQUIPABLE_ITEM_TYPES] } },
      },
      include: { item: true },
      orderBy: [{ equipped: 'desc' }, { createdAt: 'asc' }],
    }),
    getEquipmentState(characterId, client),
  ])

  if (!character) {
    throw upgradeError('No existe un personaje activo.', 404)
  }

  return {
    gold: character.gold,
    maxUpgradeLevel: MAX_UPGRADE_LEVEL,
    character: equipmentState.character,
    inventory: equipmentState.inventory,
    equipment: equipmentState.equipment,
    items: inventory.map(serializeUpgradeableItem),
    persistence: 'database',
  }
}

export async function upgradeEquipment(characterId, inventoryItemId) {
  const selected = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, characterId },
    include: { item: true },
  })

  if (!selected) {
    throw upgradeError('El objeto no pertenece a este personaje.', 404)
  }
  if (!isUpgradeableItem(selected.item)) {
    throw upgradeError('Solo se puede mejorar equipo.')
  }
  if (selected.upgradeLevel >= MAX_UPGRADE_LEVEL) {
    throw upgradeError('Este equipo ya alcanzó el nivel máximo +5.', 409)
  }

  const cost = getNextUpgradeCost(selected.upgradeLevel)

  await prisma.$transaction(async (transaction) => {
    const payment = await transaction.character.updateMany({
      where: {
        id: characterId,
        gold: { gte: cost },
      },
      data: { gold: { decrement: cost } },
    })
    if (payment.count !== 1) {
      throw upgradeError(`Necesitas ${cost} de oro para esta mejora.`, 409)
    }

    const upgrade = await transaction.inventoryItem.updateMany({
      where: {
        id: selected.id,
        characterId,
        upgradeLevel: selected.upgradeLevel,
      },
      data: { upgradeLevel: { increment: 1 } },
    })
    if (upgrade.count !== 1) {
      throw upgradeError(
        'El nivel del objeto cambió antes de completar la mejora.',
        409,
      )
    }

    await recalculateCharacterStats(characterId, transaction)
  })

  const state = await getUpgradeState(characterId)

  return {
    ...state,
    transaction: {
      inventoryItemId: selected.id,
      itemName: selected.item.name,
      fromLevel: selected.upgradeLevel,
      toLevel: selected.upgradeLevel + 1,
      cost,
      equipped: selected.equipped,
    },
    message: `${selected.item.name} mejorada a +${selected.upgradeLevel + 1}.`,
    upgradedItem: state.items.find(
      (entry) => entry.inventoryItemId === selected.id,
    ),
  }
}
