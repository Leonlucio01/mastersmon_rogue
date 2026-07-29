import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import {
  advanceCharacterMonster,
  getCurrentMapState,
  getZonesForCharacter,
  selectCharacterZone,
  serializeMapState,
} from '../services/mapProgress.js'
import { recordZoneEntered } from '../services/quests.js'

const router = Router()

router.get('/zones', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }
    const zones = await getZonesForCharacter(character)
    response.json({ currentZoneId: character.zoneId, zones })
  } catch (error) {
    next(error)
  }
})

router.get('/current', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }
    const state = await getCurrentMapState(character)
    response.json(serializeMapState(state))
  } catch (error) {
    next(error)
  }
})

router.post('/select-zone', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }
    if (!request.body.zoneId) {
      return response.status(400).json({ error: 'Selecciona una zona válida.' })
    }
    const state = await selectCharacterZone(character, request.body.zoneId)
    const questProgress = await recordZoneEntered(
      character,
      request.body.zoneId,
    )
    response.json({
      ...serializeMapState(state),
      quests: questProgress.quests,
      completedQuests: questProgress.completedQuests,
    })
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ error: error.message })
    }
    next(error)
  }
})

router.post('/next-monster', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }
    const state = await advanceCharacterMonster(character)
    response.json(serializeMapState(state))
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({
        error: error.message,
        zoneComplete: Boolean(error.zoneComplete),
      })
    }
    next(error)
  }
})

export default router
