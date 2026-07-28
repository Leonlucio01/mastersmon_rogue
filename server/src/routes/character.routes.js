import { Router } from 'express'
import { character } from '../data/mockData.js'
import { getRequestCharacter } from '../services/gameData.js'
import { serializeCharacter } from '../utils/serializers.js'

const router = Router()

router.get('/me', async (request, response) => {
  try {
    const databaseCharacter = await getRequestCharacter(request.user?.id)
    if (!databaseCharacter) return response.json(character)
    response.json(serializeCharacter(databaseCharacter))
  } catch (error) {
    console.warn('Character fallback activo:', error.message)
    response.json(character)
  }
})

export default router
