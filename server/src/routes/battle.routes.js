import { Router } from 'express'
import {
  battle,
  character as mockCharacter,
  inventory as mockInventory,
  resetBattle,
} from '../data/mockData.js'
import { prisma } from '../lib/prisma.js'
import { getCharacterInventory, getRequestCharacter } from '../services/gameData.js'
import {
  advanceCharacterMonster,
  getCurrentMapState,
  serializeMapState,
} from '../services/mapProgress.js'
import {
  serializeCharacter,
  serializeInventory,
  serializeMonster,
} from '../utils/serializers.js'

const router = Router()

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
    canAdvance: defeated,
    persistence: 'mock',
    message: defeated
      ? `${battle.enemy.name} ha sido derrotado.`
      : `${mockCharacter.name} golpea a ${battle.enemy.name}.`,
  }
}

router.get('/current', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) throw new Error('No existe un personaje activo.')
    const state = await getCurrentMapState(character)
    response.json(serializeMapState(state))
  } catch (error) {
    console.warn('Battle current fallback activo:', error.message)
    response.json({
      enemy: battle.enemy,
      zone: { name: 'Sendero Esmeralda', order: 1 },
      progress: { currentMonsterOrder: 1, totalMonsters: 4, label: 'Enemigo 1/4' },
      persistence: 'mock',
    })
  }
})

router.post('/attack', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) throw new Error('No existe un personaje activo.')
    const state = await getCurrentMapState(character)
    const monster = state.monster

    if (state.progress.currentMonsterHealth <= 0) {
      return response.status(409).json({
        error: monster.isBoss
          ? 'El boss fue derrotado. Selecciona la siguiente zona.'
          : 'El enemigo fue derrotado. Avanza al siguiente.',
        canAdvance: !monster.isBoss,
        zoneComplete: monster.isBoss,
      })
    }

    const variance = Math.floor(Math.random() * 4) - 1
    const baseDamage = Math.max(1, character.attack - monster.defense + variance)
    const wasCritical = Math.random() < (character.critRate || 0.1)
    const damage = Math.max(1, Math.round(baseDamage * (wasCritical ? 1.5 : 1)))
    const remainingHealth = Math.max(
      0,
      state.progress.currentMonsterHealth - damage,
    )
    const defeated = remainingHealth === 0
    const droppedItem =
      defeated && monster.dropItem && Math.random() < monster.dropChance
        ? monster.dropItem
        : null

    const result = await prisma.$transaction(async (transaction) => {
      const progress = await transaction.characterProgress.update({
        where: { id: state.progress.id },
        data: {
          currentMonsterHealth: remainingHealth,
          completed: defeated && monster.isBoss ? true : state.progress.completed,
        },
      })

      const nextExperience = character.experience + (defeated ? monster.rewardExp : 0)
      const nextLevel = Math.max(character.level, Math.floor(nextExperience / 100) + 1)
      const updatedCharacter = await transaction.character.update({
        where: { id: character.id },
        data: defeated
          ? {
              gold: { increment: monster.rewardGold },
              experience: { increment: monster.rewardExp },
              level: nextLevel,
              power: monster.isBoss ? { increment: 2 } : undefined,
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
          result: defeated
            ? monster.isBoss
              ? 'BOSS_VICTORY'
              : 'VICTORY'
            : 'HIT',
        },
      })

      let unlockedZone = null
      if (defeated && monster.isBoss) {
        unlockedZone = await transaction.zone.findFirst({
          where: { sortOrder: { gt: state.zone.sortOrder } },
          orderBy: { sortOrder: 'asc' },
        })
        if (unlockedZone) {
          await transaction.characterProgress.upsert({
            where: {
              characterId_zoneId: {
                characterId: character.id,
                zoneId: unlockedZone.id,
              },
            },
            update: { unlocked: true },
            create: {
              characterId: character.id,
              zoneId: unlockedZone.id,
              unlocked: true,
              currentMonsterOrder: 1,
            },
          })
        }
      }

      const inventory = await getCharacterInventory(character.id, transaction)
      return { progress, updatedCharacter, inventory, unlockedZone }
    })

    response.json({
      damage,
      wasCritical,
      defeated,
      enemy: serializeMonster({ ...monster, health: remainingHealth }),
      character: serializeCharacter(result.updatedCharacter),
      inventory: serializeInventory(result.inventory),
      rewards: defeated
        ? {
            gold: monster.rewardGold,
            experience: monster.rewardExp,
            power: monster.isBoss ? 2 : 0,
            droppedItem: droppedItem
              ? { id: droppedItem.id, name: droppedItem.name }
              : null,
          }
        : null,
      progress: {
        currentMonsterOrder: result.progress.currentMonsterOrder,
        totalMonsters: state.totalMonsters,
        label: monster.isBoss
          ? 'Boss'
          : `Enemigo ${result.progress.currentMonsterOrder}/${state.totalMonsters}`,
      },
      canAdvance: defeated && !monster.isBoss,
      zoneComplete: defeated && monster.isBoss,
      unlockedZone: result.unlockedZone
        ? { id: result.unlockedZone.id, name: result.unlockedZone.name }
        : null,
      persistence: 'database',
      message: defeated
        ? monster.isBoss
          ? `${monster.name} cayó. La zona ha sido conquistada.`
          : `${monster.name} ha sido derrotado.`
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
    if (!character) throw new Error('No existe un personaje activo.')
    const state = await advanceCharacterMonster(character)
    response.json(serializeMapState(state))
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({
        error: error.message,
        zoneComplete: Boolean(error.zoneComplete),
      })
    }
    console.warn('Battle next fallback activo:', error.message)
    resetBattle()
    response.json({ enemy: battle.enemy, persistence: 'mock' })
  }
})

export default router
