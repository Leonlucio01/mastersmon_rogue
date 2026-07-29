import { Router } from 'express'
import { character } from '../data/mockData.js'
import { prisma } from '../lib/prisma.js'
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

router.post('/rest', async (request, response, next) => {
  try {
    const currentCharacter = await getRequestCharacter(request.user?.id)
    if (!currentCharacter) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    const restedCharacter = await prisma.character.update({
      where: { id: currentCharacter.id },
      data: {
        health: currentCharacter.maxHealth,
        energy: currentCharacter.maxEnergy,
      },
    })

    response.json({
      character: serializeCharacter(restedCharacter),
      healedAmount: currentCharacter.maxHealth - currentCharacter.health,
      recoveredEnergy: currentCharacter.maxEnergy - currentCharacter.energy,
      message: `${currentCharacter.name} ha descansado y recuperó toda su vida y energía.`,
      persistence: 'database',
    })
  } catch (error) {
    next(error)
  }
})

export default router
