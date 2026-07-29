import { prisma } from '../lib/prisma.js'
import {
  serializeCharacter,
  serializeInventory,
} from '../utils/serializers.js'
import { getEquipmentState } from './equipment.js'
import { addItemToInventory, isStackableItem } from './inventory.js'
import { getUpgradeSellBonus } from './equipmentBonuses.js'

function shopError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

function normalizeQuantity(value) {
  const quantity = Number(value ?? 1)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw shopError('La cantidad debe estar entre 1 y 99.')
  }
  return quantity
}

function serializeShopItem(entry) {
  return {
    id: entry.id,
    itemId: entry.item.id,
    name: entry.item.name,
    description: entry.item.description,
    itemType: entry.item.type.toLowerCase(),
    rarity: entry.item.rarity.toLowerCase(),
    buyPrice: entry.buyPrice,
    sellPrice: entry.sellPrice,
    stock: entry.stock,
    unlimitedStock: entry.stock === null,
    availableFromZone: entry.availableFromZone
      ? {
          id: entry.availableFromZone.id,
          name: entry.availableFromZone.name,
        }
      : null,
    sortOrder: entry.sortOrder,
    bonuses: {
      attack: entry.item.attackBonus,
      defense: entry.item.defenseBonus,
      health: entry.item.healthBonus,
      crit: entry.item.critBonus,
      evasion: entry.item.evasionBonus,
      agility: entry.item.agilityBonus,
      power: entry.item.powerBonus,
    },
    healAmount: entry.item.healAmount,
  }
}

function serializeSellableInventory(inventory) {
  return inventory
    .filter(({ item }) => item.shopListing?.enabled)
    .map((entry) => ({
      ...serializeInventory([entry])[0],
      sellPrice:
        entry.item.shopListing.sellPrice +
        getUpgradeSellBonus(entry.upgradeLevel),
      canSell: !entry.equipped && entry.quantity > 0,
      sellBlockedReason: entry.equipped
        ? 'Desequipa este objeto antes de venderlo.'
        : entry.quantity <= 0
          ? 'No quedan unidades para vender.'
          : null,
    }))
}

async function getUnlockedZoneIds(characterId, client) {
  const rows = await client.characterProgress.findMany({
    where: { characterId, unlocked: true },
    select: { zoneId: true },
  })
  return new Set(rows.map(({ zoneId }) => zoneId))
}

export async function getShopState(characterId, client = prisma) {
  const [character, listings, inventory, equipment, unlockedZoneIds] =
    await Promise.all([
      client.character.findUnique({ where: { id: characterId } }),
      client.shopItem.findMany({
        where: { enabled: true },
        include: {
          item: true,
          availableFromZone: {
            select: { id: true, name: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      client.inventoryItem.findMany({
        where: { characterId },
        include: {
          item: {
            include: { shopListing: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      getEquipmentState(characterId, client),
      getUnlockedZoneIds(characterId, client),
    ])

  if (!character) throw shopError('No existe un personaje activo.', 404)

  const availableItems = listings.filter(
    (listing) =>
      !listing.availableFromZoneId ||
      unlockedZoneIds.has(listing.availableFromZoneId),
  )

  return {
    merchant: {
      name: 'Mercader Rowan',
      message: 'Compra suministros para tu aventura',
    },
    gold: character.gold,
    character: serializeCharacter(character),
    items: availableItems.map(serializeShopItem),
    sellableInventory: serializeSellableInventory(inventory),
    inventory: serializeInventory(inventory),
    equipment: equipment.equipment,
    persistence: 'database',
  }
}

export async function buyShopItem(characterId, shopItemId, rawQuantity) {
  const quantity = normalizeQuantity(rawQuantity)

  await prisma.$transaction(async (transaction) => {
    const [character, listing, unlockedZoneIds] = await Promise.all([
      transaction.character.findUnique({ where: { id: characterId } }),
      transaction.shopItem.findUnique({
        where: { id: shopItemId },
        include: { item: true },
      }),
      getUnlockedZoneIds(characterId, transaction),
    ])

    if (!character) throw shopError('No existe un personaje activo.', 404)
    if (!listing || !listing.enabled) {
      throw shopError('Este objeto no está disponible en la tienda.', 404)
    }
    if (
      listing.availableFromZoneId &&
      !unlockedZoneIds.has(listing.availableFromZoneId)
    ) {
      throw shopError('Este objeto se desbloquea en una zona posterior.', 403)
    }
    if (listing.stock !== null && listing.stock < quantity) {
      throw shopError('Rowan no tiene suficiente stock.', 409)
    }

    const totalPrice = listing.buyPrice * quantity
    const payment = await transaction.character.updateMany({
      where: {
        id: character.id,
        gold: { gte: totalPrice },
      },
      data: { gold: { decrement: totalPrice } },
    })
    if (payment.count !== 1) {
      throw shopError(`Necesitas ${totalPrice} de oro para esta compra.`, 409)
    }

    if (listing.stock !== null) {
      const stockUpdate = await transaction.shopItem.updateMany({
        where: {
          id: listing.id,
          enabled: true,
          stock: { gte: quantity },
        },
        data: { stock: { decrement: quantity } },
      })
      if (stockUpdate.count !== 1) {
        throw shopError('El stock cambió antes de completar la compra.', 409)
      }
    }

    await addItemToInventory(
      character.id,
      listing.item,
      quantity,
      transaction,
    )
  })

  const state = await getShopState(characterId)
  const purchased = state.items.find((entry) => entry.id === shopItemId)
  return {
    ...state,
    transaction: {
      type: 'BUY',
      quantity,
      itemName: purchased?.name ?? 'Objeto',
      totalGold: (purchased?.buyPrice ?? 0) * quantity,
    },
    message: `${purchased?.name ?? 'El objeto'} fue añadido al inventario.`,
  }
}

export async function sellInventoryItem(
  characterId,
  inventoryItemId,
  rawQuantity,
) {
  const quantity = normalizeQuantity(rawQuantity)
  let soldItemName = 'Objeto'
  let totalGold = 0

  await prisma.$transaction(async (transaction) => {
    const entry = await transaction.inventoryItem.findFirst({
      where: { id: inventoryItemId, characterId },
      include: {
        item: {
          include: { shopListing: true },
        },
      },
    })

    if (!entry) {
      throw shopError('El objeto no pertenece a este personaje.', 404)
    }
    if (entry.equipped || entry.slot) {
      throw shopError('Desequipa este objeto antes de venderlo.', 409)
    }
    if (!entry.item.shopListing?.enabled) {
      throw shopError('El mercader no compra este tipo de objeto.', 409)
    }
    if (entry.quantity < quantity) {
      throw shopError('No tienes suficientes unidades para vender.', 409)
    }
    if (!isStackableItem(entry.item) && quantity !== 1) {
      throw shopError('El equipo se vende una pieza a la vez.')
    }

    soldItemName =
      entry.upgradeLevel > 0
        ? `${entry.item.name} +${entry.upgradeLevel}`
        : entry.item.name
    const unitSellPrice =
      entry.item.shopListing.sellPrice +
      getUpgradeSellBonus(entry.upgradeLevel)
    totalGold = unitSellPrice * quantity
    const remainingQuantity = entry.quantity - quantity

    if (remainingQuantity <= 0) {
      await transaction.inventoryItem.delete({ where: { id: entry.id } })
    } else {
      await transaction.inventoryItem.update({
        where: { id: entry.id },
        data: { quantity: remainingQuantity },
      })
    }

    await transaction.character.update({
      where: { id: characterId },
      data: { gold: { increment: totalGold } },
    })

    if (entry.item.shopListing.stock !== null) {
      await transaction.shopItem.update({
        where: { id: entry.item.shopListing.id },
        data: { stock: { increment: quantity } },
      })
    }
  })

  return {
    ...(await getShopState(characterId)),
    transaction: {
      type: 'SELL',
      quantity,
      itemName: soldItemName,
      totalGold,
    },
    message: `Vendiste ${soldItemName} por ${totalGold} de oro.`,
  }
}
