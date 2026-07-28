import { Router } from 'express'
import { inventory } from '../data/mockData.js'

const router = Router()

router.get('/', (_request, response) => {
  response.json({
    characterId: 'demo-character',
    items: inventory,
  })
})

export default router
