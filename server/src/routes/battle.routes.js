import { Router } from 'express'
import {
  battle,
  character as mockCharacter,
  inventory as mockInventory,
  resetBattle,
} from '../data/mockData.js'
import { executeCombatAction } from '../services/combat.js'
import { getRequestCharacter } from '../services/gameData.js'
import {
  advanceCharacterMonster,
  getCurrentMapState,
  serializeMapState,
} from '../services/mapProgress.js'

const router = Router()

function mockAttack() {
  if (battle.enemy.health <= 0) resetBattle()
  const wasCritical = Math.random() < 0.1
  const baseDamage = Math.max(1, mockCharacter.attack - battle.enemy.defense)
  const damage = Math.round(baseDamage * (wasCritical ? 1.5 : 1))
  battle.enemy.health = Math.max(0, battle.enemy.health - damage)
  const defeated = battle.enemy.health === 0
  const playerEvaded = !defeated && Math.random() < mockCharacter.evasion
  const enemyDamage =
    defeated || playerEvaded
      ? 0
      : Math.max(
          1,
          (battle.enemy.attack ?? battle.enemy.power) - mockCharacter.defense,
        )
  mockCharacter.health = Math.max(0, mockCharacter.health - enemyDamage)
  const playerDefeated = mockCharacter.health === 0

  if (defeated) {
    mockCharacter.gold += 12
    mockCharacter.experience += 18
  }

  return {
    damage,
    wasCritical,
    enemyDamage,
    playerEvaded,
    playerDefeated,
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

async function performAction(request, response, skillId) {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    const result = await executeCombatAction(character, skillId)
    return response.json(result)
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({
        error: error.message,
        canAdvance: Boolean(error.canAdvance),
        zoneComplete: Boolean(error.zoneComplete),
        playerDefeated: Boolean(error.playerDefeated),
      })
    }

    console.warn('Battle action fallback activo:', error.message)
    if (!skillId) return response.json(mockAttack())
    return response.status(503).json({
      error: 'No fue posible usar la habilidad. Comprueba la base de datos.',
    })
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
      progress: {
        currentMonsterOrder: 1,
        totalMonsters: 4,
        label: 'Enemigo 1/4',
      },
      persistence: 'mock',
    })
  }
})

router.post('/attack', (request, response) =>
  performAction(request, response, null),
)

router.post('/use-skill', (request, response) => {
  const skillId = request.body.skillId
  if (!skillId) {
    return response.status(400).json({ error: 'Selecciona una habilidad.' })
  }
  return performAction(request, response, skillId)
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
