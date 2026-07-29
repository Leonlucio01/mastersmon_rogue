import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import {
  calculateOfflineStatus,
  claimOfflineRewards,
  touchCharacterActivity,
} from '../services/offlineRewards.js'

const router = Router()

router.get('/status', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    response.json({
      ...(await calculateOfflineStatus(character.id)),
      persistence: 'database',
    })
  } catch (error) {
    next(error)
  }
})

router.post('/claim', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    response.json(await claimOfflineRewards(character.id))
  } catch (error) {
    next(error)
  }
})

router.post('/touch', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    response.json({
      ...(await touchCharacterActivity(character.id)),
      persistence: 'database',
    })
  } catch (error) {
    next(error)
  }
})

export default router
