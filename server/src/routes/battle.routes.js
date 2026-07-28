import { Router } from 'express'
import {
  battle,
  character as mockCharacter,
  inventory as mockInventory,
  resetBattle,
} from '../data/mockData.js'
import { prisma } from '../lib/prisma.js'
import {
  getCharacterInventory,
  getCurrentMonster,
  getRequestCharacter,
} from '../services/gameData.js'
import {
  serializeCharacter,
  serializeInventory,
  serializeMonster,
} from '../utils/serializers.js'

const router = Router()

async function resetZoneMonsters(zoneId) {
  const monsters = await prisma.monster.findMany({ where: { zoneId } })
  await prisma.$transaction(
    monsters.map((monster) =>
      prisma.monster.update({
        where: { id: monster.id },
        data: { health: monster.maxHealth },
      }),
    ),
  )
}

function mockAttack() {
  if (battle.enemy.health <= 0) resetBattle()
  const wasCritical = Math.random() < 0.1
  const baseDamage = Math.max(1, mockCharacter.attack - battle.enemy.defense)
  const damage = Math.round(baseDamage * (wasCritical ? 1.5 : 1))
  battle.enemy.health = Math.max(0, battle.enemy.health - damage)
  const defeated = battle.enemy.health === 0

  if (defeated) {
    mockCharacter.gold += 12
    mockCharacter.experience += 18
  }

  return {
    damage,
    wasCritical,
    defeated,
    enemy: { ...battle.enemy },
    character: mockCharacter,
    inventory: mockInventory,
    rewards: defeated ? { gold: 12, experience: 18, droppedItem: null } : null,
    nextEnemy: defeated ? { name: 'Colmillo joven' } : null,
    persistence: 'mock',
    message: defeated
      ? `${battle.enemy.name} ha sido derrotado.`
      : `${mockCharacter.name} golpea a ${battle.enemy.name}.`,
  }
}

router.get('/current', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character?.zoneId) throw new Error('El personaje no tiene una zona activa.')
    let monster = await getCurrentMonster(character.zoneId)

    if (!monster) {
      await resetZoneMonsters(character.zoneId)
      monster = await getCurrentMonster(character.zoneId)
    }

    response.json({ enemy: serializeMonster(monster), persistence: 'database' })
  } catch (error) {
    console.warn('Battle current fallback activo:', error.message)
    response.json({ enemy: battle.enemy, persistence: 'mock' })
  }
})

router.post('/attack', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character?.zoneId) throw new Error('El personaje no tiene una zona activa.')
    const monster = await getCurrentMonster(character.zoneId)
    if (!monster) {
      return response.status(409).json({
        error: 'No quedan enemigos. Prepara la siguiente expedición.',
        allDefeated: true,
      })
    }

    const variance = Math.floor(Math.random() * 4) - 1
    const baseDamage = Math.max(1, character.attack - monster.defense + variance)
    const wasCritical = Math.random() < (character.critRate || 0.1)
    const damage = Math.max(1, Math.round(baseDamage * (wasCritical ? 1.5 : 1)))
    const remainingHealth = Math.max(0, monster.health - damage)
    const defeated = remainingHealth === 0
    const droppedItem =
      defeated && monster.dropItem && Math.random() < monster.dropChance
        ? monster.dropItem
        : null

    const result = await prisma.$transaction(async (transaction) => {
      const updatedMonster = await transaction.monster.update({
        where: { id: monster.id },
        data: { health: remainingHealth },
      })

      const updatedCharacter = await transaction.character.update({
        where: { id: character.id },
        data: defeated
          ? {
              gold: { increment: monster.rewardGold },
              experience: { increment: monster.rewardExp },
            }
          : {},
      })

      if (droppedItem) {
        await transaction.inventoryItem.upsert({
          where: {
            characterId_itemId: {
              characterId: character.id,
              itemId: droppedItem.id,
            },
          },
          update: { quantity: { increment: 1 } },
          create: {
            characterId: character.id,
            itemId: droppedItem.id,
            quantity: 1,
          },
        })
      }

      await transaction.battleLog.create({
        data: {
          characterId: character.id,
          monsterId: monster.id,
          damage,
          wasCritical,
          monsterDefeated: defeated,
          goldReward: defeated ? monster.rewardGold : 0,
          expReward: defeated ? monster.rewardExp : 0,
          droppedItemId: droppedItem?.id,
          result: defeated ? 'VICTORY' : 'HIT',
        },
      })

      const inventory = await getCharacterInventory(character.id, transaction)
      const nextEnemy = defeated
        ? await transaction.monster.findFirst({
            where: {
              zoneId: character.zoneId,
              health: { gt: 0 },
              id: { not: monster.id },
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          })
        : null

      return { updatedMonster, updatedCharacter, inventory, nextEnemy }
    })

    response.json({
      damage,
      wasCritical,
      defeated,
      enemy: serializeMonster(result.updatedMonster),
      character: serializeCharacter(result.updatedCharacter),
      inventory: serializeInventory(result.inventory),
      rewards: defeated
        ? {
            gold: monster.rewardGold,
            experience: monster.rewardExp,
            droppedItem: droppedItem
              ? { id: droppedItem.id, name: droppedItem.name }
              : null,
          }
        : null,
      nextEnemy: serializeMonster(result.nextEnemy),
      persistence: 'database',
      message: defeated
        ? `${monster.name} ha sido derrotado.`
        : `${character.name} golpea a ${monster.name}.`,
    })
  } catch (error) {
    console.warn('Battle attack fallback activo:', error.message)
    response.json(mockAttack())
  }
})

router.post('/next', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character?.zoneId) throw new Error('El personaje no tiene una zona activa.')
    let monster = await getCurrentMonster(character.zoneId)
    let respawned = false

    if (!monster) {
      await resetZoneMonsters(character.zoneId)
      monster = await getCurrentMonster(character.zoneId)
      respawned = true
    }

    response.json({
      enemy: serializeMonster(monster),
      respawned,
      persistence: 'database',
    })
  } catch (error) {
    console.warn('Battle next fallback activo:', error.message)
    resetBattle()
    response.json({ enemy: battle.enemy, respawned: true, persistence: 'mock' })
  }
})

export default router
