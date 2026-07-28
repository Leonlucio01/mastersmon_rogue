import { create } from 'zustand'
import {
  attackEnemy,
  getCharacter,
  getHealth,
  getInventory,
} from '../services/api'

const fallbackCharacter = {
  name: 'Kael',
  level: 1,
  gold: 125,
  gems: 8,
  energy: 74,
  maxEnergy: 100,
  power: 18,
  health: 100,
  maxHealth: 100,
}

const fallbackInventory = [
  { id: 'potion', name: 'Poción menor', quantity: 3, type: 'CONSUMABLE' },
  { id: 'sword', name: 'Espada de aprendiz', quantity: 1, type: 'WEAPON' },
  { id: 'herb', name: 'Hierba lunar', quantity: 4, type: 'MATERIAL' },
]

export const useGameStore = create((set, get) => ({
  character: fallbackCharacter,
  inventory: fallbackInventory,
  enemy: {
    name: 'Slime musgoso',
    health: 45,
    maxHealth: 45,
  },
  serverOnline: false,
  isLoading: true,
  isAttacking: false,
  message: 'Preparando la expedición...',

  loadGame: async () => {
    set({ isLoading: true })

    try {
      await getHealth()
      const [characterResponse, inventoryResponse] = await Promise.all([
        getCharacter(),
        getInventory(),
      ])

      set({
        character: characterResponse.data,
        inventory: inventoryResponse.data.items,
        serverOnline: true,
        message: 'Un Slime musgoso bloquea el sendero.',
      })
    } catch {
      set({
        serverOnline: false,
        message: 'Modo local: inicia el backend para sincronizar la partida.',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  attack: async () => {
    const { enemy, isAttacking } = get()
    if (isAttacking || enemy.health <= 0) return

    set({ isAttacking: true, message: 'Kael prepara el ataque...' })

    try {
      const response = await attackEnemy()
      const { damage, enemyHealth, message } = response.data
      set((state) => ({
        enemy: { ...state.enemy, health: enemyHealth },
        message: `${message} Infligiste ${damage} de daño.`,
        serverOnline: true,
      }))
    } catch {
      const damage = Math.floor(Math.random() * 7) + 8
      const enemyHealth = Math.max(0, enemy.health - damage)
      set({
        enemy: { ...enemy, health: enemyHealth },
        message:
          enemyHealth === 0
            ? `¡Victoria local! Infligiste ${damage} de daño.`
            : `Ataque local: ${damage} de daño.`,
      })
    } finally {
      window.setTimeout(() => set({ isAttacking: false }), 320)
    }
  },
}))
