import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import {
  claimCharacterQuest,
  getCharacterQuests,
} from '../services/quests.js'

const router = Router()

router.get('/', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }
    const result = await getCharacterQuests(character)
    response.json({
      quests: result.quests,
      completedQuests: result.completedQuests,
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
    if (!request.body.characterQuestId) {
      return response.status(400).json({ error: 'Selecciona una misión.' })
    }
    const result = await claimCharacterQuest(
      character,
      request.body.characterQuestId,
    )
    response.json({
      ...result,
      persistence: 'database',
      message: `Recompensa de “${result.claimedQuest.title}” reclamada.`,
    })
  } catch (error) {
    if (error.status) {
      return response.status(error.status).json({ error: error.message })
    }
    next(error)
  }
})

export default router
