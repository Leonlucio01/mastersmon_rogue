import { Router } from 'express'
import { inventory } from '../data/mockData.js'
import { prisma } from '../lib/prisma.js'
import { getCharacterInventory, getRequestCharacter } from '../services/gameData.js'
import { serializeCharacter, serializeInventory } from '../utils/serializers.js'

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

router.post('/use', async (request, response, next) => {
  try {
    const character = await getRequestCharacter(request.user?.id)
    if (!character) {
      return response.status(404).json({ error: 'No existe un personaje activo.' })
    }

    const inventoryItemId = request.body.inventoryItemId
    if (!inventoryItemId) {
      return response.status(400).json({ error: 'Selecciona un consumible.' })
    }

    const entry = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, characterId: character.id },
      include: { item: true },
    })
    if (!entry) {
      return response.status(404).json({ error: 'El objeto no pertenece al personaje.' })
    }
    if (entry.item.type !== 'CONSUMABLE' || entry.item.healAmount <= 0) {
      return response.status(400).json({ error: 'Este objeto no es un consumible curativo.' })
    }
    if (entry.quantity <= 0) {
      return response.status(409).json({ error: 'No quedan unidades de este consumible.' })
    }
    if (character.health >= character.maxHealth) {
      return response.status(409).json({ error: 'Tu vida ya está al máximo.' })
    }

    const healedAmount = Math.min(
      entry.item.healAmount,
      character.maxHealth - character.health,
    )
    const result = await prisma.$transaction(async (transaction) => {
      const updatedCharacter = await transaction.character.update({
        where: { id: character.id },
        data: { health: { increment: healedAmount } },
      })
      await transaction.inventoryItem.update({
        where: { id: entry.id },
        data: { quantity: { decrement: 1 } },
      })
      const updatedInventory = await getCharacterInventory(
        character.id,
        transaction,
      )
      return { updatedCharacter, updatedInventory }
    })

    response.json({
      character: serializeCharacter(result.updatedCharacter),
      inventory: serializeInventory(result.updatedInventory),
      healedAmount,
      message: `${character.name} recuperó ${healedAmount} HP con ${entry.item.name}.`,
      persistence: 'database',
    })
  } catch (error) {
    next(error)
  }
})

export default router
