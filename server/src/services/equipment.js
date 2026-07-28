import { prisma } from '../lib/prisma.js'
import { serializeCharacter, serializeInventory } from '../utils/serializers.js'

export const EQUIPMENT_SLOTS = [
  'WEAPON',
  'HELMET',
  'ARMOR',
  'BOOTS',
  'NECKLACE',
  'RING',
  'ARTIFACT',
]

const equipableTypes = new Set(EQUIPMENT_SLOTS)

function roundRate(value) {
  return Math.round(value * 10000) / 10000
}

export function isEquipableItem(item) {
  return equipableTypes.has(item.type)
}

export function getSlotForItem(item) {
  return isEquipableItem(item) ? item.type : null
}

export async function recalculateCharacterStats(characterId, client = prisma) {
  const [character, equippedItems] = await Promise.all([
    client.character.findUnique({ where: { id: characterId } }),
    client.inventoryItem.findMany({
      where: {
        characterId,
        equipped: true,
        slot: { not: null },
      },
      include: { item: true },
    }),
  ])

  if (!character) throw new Error('No existe el personaje.')

  const totals = equippedItems.reduce(
    (sum, entry) => ({
      attack: sum.attack + entry.item.attackBonus,
      defense: sum.defense + entry.item.defenseBonus,
      health: sum.health + entry.item.healthBonus,
      crit: sum.crit + entry.item.critBonus,
      evasion: sum.evasion + entry.item.evasionBonus,
      agility: sum.agility + entry.item.agilityBonus,
      power: sum.power + entry.item.powerBonus,
    }),
    { attack: 0, defense: 0, health: 0, crit: 0, evasion: 0, agility: 0, power: 0 },
  )

  const maxHealth = character.baseMaxHealth + totals.health
  const healthDifference = maxHealth - character.maxHealth
  const health =
    healthDifference > 0
      ? Math.min(maxHealth, character.health + healthDifference)
      : Math.min(character.health, maxHealth)

  return client.character.update({
    where: { id: characterId },
    data: {
      attack: character.baseAttack + totals.attack,
      defense: character.baseDefense + totals.defense,
      maxHealth,
      health,
      critRate: roundRate(character.baseCritRate + totals.crit),
      evasion: roundRate(character.baseEvasion + totals.evasion),
      agility: character.baseAgility + totals.agility,
      power: character.basePower + totals.power,
    },
  })
}

export async function getEquipmentState(characterId, client = prisma) {
  const [character, inventory] = await Promise.all([
    client.character.findUnique({ where: { id: characterId } }),
    client.inventoryItem.findMany({
      where: { characterId },
      include: { item: true },
      orderBy: [{ equipped: 'desc' }, { createdAt: 'asc' }],
    }),
  ])
  const serializedInventory = serializeInventory(inventory)
  const equippedBySlot = Object.fromEntries(
    EQUIPMENT_SLOTS.map((slot) => [slot.toLowerCase(), null]),
  )

  for (const item of serializedInventory) {
    if (item.equipped && item.slot) equippedBySlot[item.slot] = item
  }

  return {
    character: serializeCharacter(character),
    inventory: serializedInventory,
    equipment: equippedBySlot,
  }
}

export async function equipInventoryItem(characterId, inventoryItemId) {
  const entry = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, characterId },
    include: { item: true },
  })

  if (!entry) {
    const error = new Error('El objeto no pertenece a este personaje.')
    error.status = 404
    throw error
  }
  const slot = getSlotForItem(entry.item)
  if (!slot) {
    const error = new Error('Este objeto no se puede equipar.')
    error.status = 400
    throw error
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.inventoryItem.updateMany({
      where: {
        characterId,
        slot,
        id: { not: entry.id },
      },
      data: { equipped: false, slot: null },
    })
    await transaction.inventoryItem.update({
      where: { id: entry.id },
      data: { equipped: true, slot },
    })
    await recalculateCharacterStats(characterId, transaction)
  })

  return getEquipmentState(characterId)
}

export async function unequipInventoryItem(characterId, inventoryItemId) {
  const entry = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, characterId },
  })

  if (!entry) {
    const error = new Error('El objeto no pertenece a este personaje.')
    error.status = 404
    throw error
  }
  if (!entry.equipped) {
    const error = new Error('El objeto ya está desequipado.')
    error.status = 400
    throw error
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.inventoryItem.update({
      where: { id: entry.id },
      data: { equipped: false, slot: null },
    })
    await recalculateCharacterStats(characterId, transaction)
  })

  return getEquipmentState(characterId)
}
