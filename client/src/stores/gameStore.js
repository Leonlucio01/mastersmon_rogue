import { create } from 'zustand'
import {
  attackEnemy,
  getCharacter,
  getCurrentBattle,
  getHealth,
  getInventory,
  getNextEnemy,
} from '../services/api'

const fallbackCharacter = {
  name: 'Kael',
  class: 'Vanguardia',
  level: 1,
  experience: 0,
  gold: 125,
  gems: 8,
  energy: 74,
  maxEnergy: 100,
  power: 18,
  attack: 18,
  defense: 4,
  health: 100,
  maxHealth: 100,
}

const fallbackInventory = [
  { id: 'potion', name: 'Poción menor', quantity: 3, type: 'CONSUMABLE' },
  { id: 'sword', name: 'Espada de aprendiz', quantity: 1, type: 'WEAPON' },
  { id: 'herb', name: 'Hierba lunar', quantity: 4, type: 'MATERIAL' },
]

const fallbackEnemy = {
  id: 'moss-slime',
  name: 'Slime musgoso',
  species: 'Slime',
  level: 1,
  health: 45,
  maxHealth: 45,
  defense: 2,
}

export const useGameStore = create((set, get) => ({
  character: fallbackCharacter,
  inventory: fallbackInventory,
  enemy: fallbackEnemy,
  serverOnline: false,
  persistence: 'mock',
  isLoading: true,
  isAttacking: false,
  isChangingEnemy: false,
  message: 'Preparando la expedición...',
  lastHit: null,
  rewards: null,
  nextEnemy: null,
  impactKey: 0,

  loadGame: async () => {
    set({ isLoading: true, rewards: null, lastHit: null })

    try {
      await getHealth()
      const [characterResponse, inventoryResponse, battleResponse] =
        await Promise.all([
          getCharacter(),
          getInventory(),
          getCurrentBattle(),
        ])

      set({
        character: characterResponse.data,
        inventory: inventoryResponse.data.items,
        enemy: battleResponse.data.enemy ?? fallbackEnemy,
        persistence: battleResponse.data.persistence,
        serverOnline: true,
        nextEnemy: null,
        message: `Un ${battleResponse.data.enemy?.name ?? 'enemigo'} bloquea el sendero.`,
      })
    } catch {
      set({
        character: fallbackCharacter,
        inventory: fallbackInventory,
        enemy: fallbackEnemy,
        persistence: 'mock',
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

    set({
      isAttacking: true,
      message: 'El golpe atraviesa la bruma...',
      rewards: null,
    })

    try {
      const response = await attackEnemy()
      const result = response.data
      set((state) => ({
        enemy: result.enemy,
        character: result.character ?? state.character,
        inventory: result.inventory ?? state.inventory,
        lastHit: {
          damage: result.damage,
          wasCritical: result.wasCritical,
          id: Date.now(),
        },
        rewards: result.rewards,
        nextEnemy: result.nextEnemy,
        impactKey: state.impactKey + 1,
        persistence: result.persistence,
        message: result.wasCritical
          ? `¡CRÍTICO! ${result.message}`
          : result.message,
        serverOnline: true,
      }))
    } catch (error) {
      set({
        message:
          error.response?.data?.error ??
          'El ataque falló. Comprueba la conexión con el servidor.',
      })
    } finally {
      window.setTimeout(() => set({ isAttacking: false }), 520)
    }
  },

  advanceEnemy: async () => {
    if (get().isChangingEnemy) return
    set({ isChangingEnemy: true, message: 'Buscando huellas en el sendero...' })

    try {
      const response = await getNextEnemy()
      set({
        enemy: response.data.enemy ?? fallbackEnemy,
        rewards: null,
        lastHit: null,
        nextEnemy: null,
        persistence: response.data.persistence,
        message: response.data.respawned
          ? 'Las criaturas regresaron al sendero.'
          : `${response.data.enemy.name} emerge de la maleza.`,
      })
    } catch {
      set({ message: 'No fue posible preparar al siguiente enemigo.' })
    } finally {
      set({ isChangingEnemy: false })
    }
  },
}))
