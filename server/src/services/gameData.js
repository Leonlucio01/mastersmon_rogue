import { prisma } from '../lib/prisma.js'

export const DEMO_EMAIL = 'demo@mastersmon.local'

export async function getRequestCharacter(userId) {
  if (userId) {
    return prisma.character.findUnique({ where: { userId } })
  }

  return prisma.character.findFirst({
    where: { user: { email: DEMO_EMAIL } },
  })
}

export async function getCharacterInventory(characterId, client = prisma) {
  return client.inventoryItem.findMany({
    where: { characterId },
    include: { item: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getCurrentMonster(zoneId, client = prisma) {
  return client.monster.findFirst({
    where: {
      zoneId,
      health: { gt: 0 },
    },
    include: { dropItem: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
}
