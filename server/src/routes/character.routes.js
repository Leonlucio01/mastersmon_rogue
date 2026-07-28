import { Router } from 'express'
import { character } from '../data/mockData.js'

const router = Router()

router.get('/me', (_request, response) => {
  response.json(character)
})

export default router
