import { create } from 'zustand'
import {
  attackEnemy,
  getCharacter,
  getHealth,
  getInventory,
  getMapCurrent,
  getMapZones,
  nextMapMonster,
  selectMapZone,
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
  order: 1,
  isBoss: false,
}

const fallbackZone = {
  id: 'emerald-path',
  name: 'Sendero Esmeralda',
  description: 'Un antiguo sendero cubierto de musgo.',
  order: 1,
}

const fallbackProgress = {
  currentMonsterOrder: 1,
  totalMonsters: 4,
  label: 'Enemigo 1/4',
  completed: false,
}

const fallbackZones = [
  {
    ...fallbackZone,
    requiredLevel: 1,
    requiredPower: 0,
    unlocked: true,
    available: true,
    meetsRequirements: true,
    selected: true,
    completed: false,
    currentMonsterOrder: 1,
    totalMonsters: 4,
    monsters: [
      { id: 'demo-1', name: 'Slime musgoso', order: 1, isBoss: false },
      { id: 'demo-2', name: 'Colmillo joven', order: 2, isBoss: false },
      { id: 'demo-3', name: 'Espora errante', order: 3, isBoss: false },
      { id: 'demo-4', name: 'Guardián de Raíz', order: 4, isBoss: true },
    ],
  },
  {
    id: 'shadow-mine',
    name: 'Mina Umbría',
    description: 'Galerías olvidadas bajo la montaña.',
    order: 2,
    requiredLevel: 2,
    requiredPower: 18,
    unlocked: false,
    available: false,
    meetsRequirements: false,
    selected: false,
    completed: false,
    currentMonsterOrder: 1,
    totalMonsters: 4,
    monsters: [
      { id: 'demo-5', name: 'Murciélago de hollín', order: 1, isBoss: false },
      { id: 'demo-6', name: 'Minero espectral', order: 2, isBoss: false },
      { id: 'demo-7', name: 'Escarabajo férreo', order: 3, isBoss: false },
      { id: 'demo-8', name: 'Capataz Umbrío', order: 4, isBoss: true },
    ],
  },
]

export const useGameStore = create((set, get) => ({
  character: fallbackCharacter,
  inventory: fallbackInventory,
  enemy: fallbackEnemy,
  zones: fallbackZones,
  currentZone: fallbackZone,
  progress: fallbackProgress,
  serverOnline: false,
  persistence: 'mock',
  isLoading: true,
  isAttacking: false,
  isChangingEnemy: false,
  isSelectingZone: false,
  message: 'Preparando la expedición...',
  lastHit: null,
  rewards: null,
  canAdvance: false,
  zoneComplete: false,
  unlockNotice: '',
  impactKey: 0,

  loadGame: async () => {
    set({ isLoading: true, rewards: null, lastHit: null, unlockNotice: '' })

    try {
      await getHealth()
      const [characterResponse, inventoryResponse, zonesResponse, mapResponse] =
        await Promise.all([
          getCharacter(),
          getInventory(),
          getMapZones(),
          getMapCurrent(),
        ])
      const current = mapResponse.data

      set({
        character: characterResponse.data,
        inventory: inventoryResponse.data.items,
        zones: zonesResponse.data.zones,
        currentZone: current.zone,
        progress: current.progress,
        enemy: current.enemy ?? fallbackEnemy,
        persistence: current.persistence,
        canAdvance: current.enemy.health <= 0 && !current.enemy.isBoss,
        zoneComplete: current.enemy.health <= 0 && current.enemy.isBoss,
        serverOnline: true,
        message: `${current.enemy.name} bloquea el avance por ${current.zone.name}.`,
      })
    } catch {
      set({
        character: fallbackCharacter,
        inventory: fallbackInventory,
        enemy: fallbackEnemy,
        zones: fallbackZones,
        currentZone: fallbackZone,
        progress: fallbackProgress,
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
      unlockNotice: '',
    })

    try {
      const response = await attackEnemy()
      const result = response.data
      set((state) => ({
        enemy: result.enemy,
        character: result.character ?? state.character,
        inventory: result.inventory ?? state.inventory,
        progress: result.progress ?? state.progress,
        lastHit: {
          damage: result.damage,
          wasCritical: result.wasCritical,
          id: Date.now(),
        },
        rewards: result.rewards,
        canAdvance: Boolean(result.canAdvance),
        zoneComplete: Boolean(result.zoneComplete),
        unlockNotice: result.unlockedZone
          ? `¡Nueva zona desbloqueada: ${result.unlockedZone.name}!`
          : '',
        zones:
          result.unlockedZone || result.zoneComplete
            ? state.zones.map((zone) =>
                result.unlockedZone && zone.id === result.unlockedZone.id
                  ? { ...zone, unlocked: true, available: true }
                  : zone.id === state.currentZone.id && result.zoneComplete
                    ? { ...zone, completed: true }
                    : zone,
              )
            : state.zones,
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
    if (get().isChangingEnemy || !get().canAdvance) return
    set({ isChangingEnemy: true, message: 'Siguiendo huellas en el sendero...' })

    try {
      const response = await nextMapMonster()
      const current = response.data
      set((state) => ({
        enemy: current.enemy,
        currentZone: current.zone,
        progress: current.progress,
        rewards: null,
        lastHit: null,
        canAdvance: false,
        zoneComplete: false,
        zones: state.zones.map((zone) =>
          zone.id === current.zone.id
            ? {
                ...zone,
                currentMonsterOrder: current.progress.currentMonsterOrder,
              }
            : zone,
        ),
        persistence: current.persistence,
        message: `${current.enemy.name} emerge en el camino.`,
      }))
    } catch (error) {
      set({
        message:
          error.response?.data?.error ??
          'No fue posible preparar al siguiente enemigo.',
      })
    } finally {
      set({ isChangingEnemy: false })
    }
  },

  selectZone: async (zoneId) => {
    if (get().isSelectingZone || zoneId === get().currentZone.id) return
    set({ isSelectingZone: true, message: 'Abriendo la ruta entre zonas...' })
    try {
      const response = await selectMapZone(zoneId)
      const current = response.data
      set((state) => ({
        currentZone: current.zone,
        progress: current.progress,
        enemy: current.enemy,
        rewards: null,
        lastHit: null,
        canAdvance: current.enemy.health <= 0 && !current.enemy.isBoss,
        zoneComplete: current.enemy.health <= 0 && current.enemy.isBoss,
        unlockNotice: '',
        zones: state.zones.map((zone) => ({
          ...zone,
          selected: zone.id === current.zone.id,
        })),
        message: `Has entrado en ${current.zone.name}.`,
      }))
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible viajar a esa zona.',
      })
    } finally {
      set({ isSelectingZone: false })
    }
  },
}))
