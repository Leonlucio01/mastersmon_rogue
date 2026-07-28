import { Router } from 'express'
import { inventory } from '../data/mockData.js'
import { getCharacterInventory, getRequestCharacter } from '../services/gameData.js'
import { serializeInventory } from '../utils/serializers.js'

const router = Router()

router.get('/', async (request, response) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) throw new Error('No existe el personaje demo.')
    const items = await getCharacterInventory(character.id)
    response.json({
      characterId: character.id,
      items: serializeInventory(items),
    })
  } catch (error) {
    console.warn('Inventory fallback activo:', error.message)
    response.json({
      characterId: 'demo-character',
      items: inventory,
    })
  }
})

export default router
