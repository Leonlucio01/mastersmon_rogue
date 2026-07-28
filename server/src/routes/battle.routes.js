import { Router } from 'express'
import { battle, character, resetBattle } from '../data/mockData.js'

const router = Router()

router.post('/attack', (_request, response) => {
  if (battle.enemy.health <= 0) {
    resetBattle()
  }

  const variance = Math.floor(Math.random() * 7) - 3
  const damage = Math.max(1, character.power + variance)
  battle.enemy.health = Math.max(0, battle.enemy.health - damage)
  const defeated = battle.enemy.health === 0

  response.json({
    attacker: character.name,
    target: battle.enemy.name,
    damage,
    enemyHealth: battle.enemy.health,
    enemyMaxHealth: battle.enemy.maxHealth,
    defeated,
    message: defeated
      ? `${battle.enemy.name} ha sido derrotado.`
      : `${character.name} golpea a ${battle.enemy.name}.`,
  })
})

export default router
