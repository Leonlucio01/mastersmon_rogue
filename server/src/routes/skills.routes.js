import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import { getActiveEffects, getCharacterSkills } from '../services/skills.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    const skills = await getCharacterSkills(character)
    const characterSkills = await prisma.characterSkill.findMany({
      where: { characterId: character.id },
      include: { skill: true },
      orderBy: { createdAt: 'asc' },
    })

    response.json({
      skills,
      activeEffects: getActiveEffects(characterSkills),
      energy: character.energy,
      maxEnergy: character.maxEnergy,
      persistence: 'database',
    })
  } catch (error) {
    next(error)
  }
})

export default router
