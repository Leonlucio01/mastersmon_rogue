import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import {
  equipInventoryItem,
  getEquipmentState,
  unequipInventoryItem,
} from '../services/equipment.js'

const router = Router()

async function getCharacter(request, response) {
  const character = await getRequestCharacter(request.user?.id)
  if (!character) {
    response.status(404).json({ error: 'No existe un personaje activo.' })
    return null
  }
  return character
}

router.get('/', async (request, response, next) => {
  try {
    const character = await getCharacter(request, response)
    if (!character) return
    response.json(await getEquipmentState(character.id))
  } catch (error) {
    next(error)
  }
})

router.post('/equip', async (request, response, next) => {
  try {
    const character = await getCharacter(request, response)
    if (!character) return
    if (!request.body.inventoryItemId) {
      return response.status(400).json({ error: 'Selecciona un objeto para equipar.' })
    }
    response.json(
      await equipInventoryItem(character.id, request.body.inventoryItemId),
    )
  } catch (error) {
    if (error.status) return response.status(error.status).json({ error: error.message })
    next(error)
  }
})

router.post('/unequip', async (request, response, next) => {
  try {
    const character = await getCharacter(request, response)
    if (!character) return
    if (!request.body.inventoryItemId) {
      return response.status(400).json({ error: 'Selecciona un objeto para desequipar.' })
    }
    response.json(
      await unequipInventoryItem(character.id, request.body.inventoryItemId),
    )
  } catch (error) {
    if (error.status) return response.status(error.status).json({ error: error.message })
    next(error)
  }
})

export default router
