import { Router } from 'express'
import { getRequestCharacter } from '../services/gameData.js'
import {
  buyShopItem,
  getShopState,
  sellInventoryItem,
} from '../services/shop.js'

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
    response.json(await getShopState(character.id))
  } catch (error) {
    next(error)
  }
})

router.post('/buy', async (request, response, next) => {
  try {
    const character = await getCharacter(request, response)
    if (!character) return
    if (!request.body.shopItemId) {
      return response.status(400).json({ error: 'Selecciona un objeto para comprar.' })
    }
    response.json(
      await buyShopItem(
        character.id,
        request.body.shopItemId,
        request.body.quantity,
      ),
    )
  } catch (error) {
    next(error)
  }
})

router.post('/sell', async (request, response, next) => {
  try {
    const character = await getCharacter(request, response)
    if (!character) return
    if (!request.body.inventoryItemId) {
      return response.status(400).json({ error: 'Selecciona un objeto para vender.' })
    }
    response.json(
      await sellInventoryItem(
        character.id,
        request.body.inventoryItemId,
        request.body.quantity,
      ),
    )
  } catch (error) {
    next(error)
  }
})

export default router
