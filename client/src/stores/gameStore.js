import { create } from 'zustand'
import {
  attackEnemy,
  equipItem as equipItemRequest,
  getCharacter,
  getEquipment,
  getHealth,
  getMapCurrent,
  getMapZones,
  getSkills,
  nextMapMonster,
  restCharacter,
  selectMapZone,
  unequipItem as unequipItemRequest,
  useBattleSkill,
  useInventoryItem,
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
  { inventoryItemId: 'demo-potion', id: 'potion', name: 'Poción menor', quantity: 3, type: 'CONSUMABLE', itemType: 'consumable', rarity: 'common', equipped: false, healAmount: 25, bonuses: {} },
  { inventoryItemId: 'demo-sword', id: 'sword', name: 'Espada de aprendiz', quantity: 1, type: 'WEAPON', itemType: 'weapon', rarity: 'common', equipped: true, slot: 'weapon', bonuses: { attack: 5, power: 5 } },
  { inventoryItemId: 'demo-herb', id: 'herb', name: 'Hierba lunar', quantity: 4, type: 'MATERIAL', itemType: 'material', rarity: 'common', equipped: false, bonuses: {} },
]

const emptyEquipment = {
  weapon: fallbackInventory[1],
  helmet: null,
  armor: null,
  boots: null,
  necklace: null,
  ring: null,
  artifact: null,
}

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

const fallbackSkills = [
  { id: 'basic', name: 'Ataque básico', description: 'Golpe fiable.', skillType: 'basic', damageMultiplier: 1, critBonus: 0, energyCost: 0, cooldownTurns: 0, cooldownRemaining: 0, requiredLevel: 1, icon: '⚔', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'swift', name: 'Corte veloz', description: 'Ataque rápido.', skillType: 'damage', damageMultiplier: 1.2, critBonus: 0, energyCost: 12, cooldownTurns: 1, cooldownRemaining: 0, requiredLevel: 1, icon: '≋', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'shadow', name: 'Golpe sombrío', description: 'Golpe de alto daño.', skillType: 'damage', damageMultiplier: 1.8, critBonus: 0.2, energyCost: 28, cooldownTurns: 3, cooldownRemaining: 0, requiredLevel: 1, icon: '☾', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'evade', name: 'Paso evasivo', description: 'Aumenta la evasión.', skillType: 'buff', damageMultiplier: 0, critBonus: 0, energyCost: 14, cooldownTurns: 3, cooldownRemaining: 0, requiredLevel: 1, icon: '◇', evasionBonus: 0.3, durationTurns: 2, activeTurns: 0 },
]

function combatUpdate(result, state) {
  const skillName = result.skillName ?? result.skill?.name ?? state.activeSkillName
  return {
    enemy: result.enemy,
    character: result.character ?? state.character,
    inventory: result.inventory ?? state.inventory,
    skills: result.skills ?? state.skills,
    activeEffects: result.activeEffects ?? state.activeEffects,
    progress: result.progress ?? state.progress,
    lastHit: result.damage > 0
      ? {
          damage: result.damage,
          wasCritical: result.wasCritical,
          skillName,
          id: Date.now(),
        }
      : null,
    lastCounter:
      result.enemyDamage > 0 || result.playerEvaded
        ? {
            damage: result.enemyDamage,
            evaded: result.playerEvaded,
            id: Date.now() + 1,
          }
        : null,
    playerDefeated: Boolean(result.playerDefeated),
    combatEvent: {
      skillName,
      damage: result.damage ?? 0,
      enemyDamage: result.enemyDamage ?? 0,
      wasCritical: Boolean(result.wasCritical),
      playerEvaded: Boolean(result.playerEvaded),
      playerDefeated: Boolean(result.playerDefeated),
      monsterDefeated: Boolean(
        result.monsterDefeated ?? result.defeated,
      ),
      result: result.result,
      id: Date.now() + 2,
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
  }
}

export const useGameStore = create((set, get) => ({
  character: fallbackCharacter,
  inventory: fallbackInventory,
  equipment: emptyEquipment,
  skills: fallbackSkills,
  activeEffects: [],
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
  isResting: false,
  updatingItemId: null,
  message: 'Preparando la expedición...',
  lastHit: null,
  lastCounter: null,
  playerDefeated: false,
  activeSkillName: 'Ataque básico',
  actionKey: 0,
  combatEvent: null,
  healEvent: null,
  rewards: null,
  canAdvance: false,
  zoneComplete: false,
  unlockNotice: '',
  impactKey: 0,

  loadGame: async () => {
    set({
      isLoading: true,
      rewards: null,
      lastHit: null,
      lastCounter: null,
      combatEvent: null,
      healEvent: null,
      unlockNotice: '',
    })

    try {
      await getHealth()
      const [characterResponse, equipmentResponse, zonesResponse, mapResponse, skillsResponse] =
        await Promise.all([
          getCharacter(),
          getEquipment(),
          getMapZones(),
          getMapCurrent(),
          getSkills(),
        ])
      const current = mapResponse.data

      set({
        character: equipmentResponse.data.character ?? characterResponse.data,
        inventory: equipmentResponse.data.inventory,
        equipment: equipmentResponse.data.equipment,
        skills: skillsResponse.data.skills,
        activeEffects: skillsResponse.data.activeEffects,
        zones: zonesResponse.data.zones,
        currentZone: current.zone,
        progress: current.progress,
        enemy: current.enemy ?? fallbackEnemy,
        persistence: current.persistence,
        canAdvance: current.enemy.health <= 0 && !current.enemy.isBoss,
        zoneComplete: current.enemy.health <= 0 && current.enemy.isBoss,
        playerDefeated:
          (equipmentResponse.data.character ?? characterResponse.data).health <= 0,
        serverOnline: true,
        message: `${current.enemy.name} bloquea el avance por ${current.zone.name}.`,
      })
    } catch {
      set({
        character: fallbackCharacter,
        inventory: fallbackInventory,
        equipment: emptyEquipment,
        skills: fallbackSkills,
        activeEffects: [],
        enemy: fallbackEnemy,
        zones: fallbackZones,
        currentZone: fallbackZone,
        progress: fallbackProgress,
        persistence: 'mock',
        playerDefeated: false,
        serverOnline: false,
        message: 'Modo local: inicia el backend para sincronizar la partida.',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  attack: async () => {
    const { enemy, isAttacking, character } = get()
    if (isAttacking || enemy.health <= 0 || character.health <= 0) return

    set((state) => ({
      isAttacking: true,
      activeSkillName: 'Ataque básico',
      actionKey: state.actionKey + 1,
      message: 'El golpe atraviesa la bruma...',
      rewards: null,
      unlockNotice: '',
    }))

    try {
      const response = await attackEnemy()
      const result = response.data
      set((state) => combatUpdate(result, state))
    } catch (error) {
      set({
        message:
          error.response?.data?.error ??
          'El ataque falló. Comprueba la conexión con el servidor.',
      })
    } finally {
      window.setTimeout(() => set({ isAttacking: false }), 580)
    }
  },

  useSkill: async (skill) => {
    if (skill.name === 'Ataque básico') {
      return get().attack()
    }

    const { enemy, isAttacking, character } = get()
    if (
      isAttacking ||
      enemy.health <= 0 ||
      skill.cooldownRemaining > 0 ||
      character.energy < skill.energyCost
      || character.health <= 0
    ) return

    set((state) => ({
      isAttacking: true,
      activeSkillName: skill.name,
      actionKey: state.actionKey + 1,
      message: `${skill.name} concentra su energía...`,
      rewards: null,
      unlockNotice: '',
    }))

    try {
      const response = await useBattleSkill(skill.id)
      set((state) => combatUpdate(response.data, state))
    } catch (error) {
      set({
        message:
          error.response?.data?.error ??
          'La habilidad falló. Comprueba la conexión con el servidor.',
      })
    } finally {
      const duration = skill.name === 'Golpe sombrío'
        ? 760
        : skill.name === 'Corte veloz'
          ? 540
          : 620
      window.setTimeout(() => set({ isAttacking: false }), duration)
    }
  },

  rest: async () => {
    if (get().isResting) return
    set({ isResting: true, message: 'Preparando un refugio seguro...' })
    try {
      const response = await restCharacter()
      set({
        character: response.data.character,
        playerDefeated: false,
        lastCounter: null,
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible descansar.',
      })
    } finally {
      set({ isResting: false })
    }
  },

  useItem: async (inventoryItemId) => {
    if (get().updatingItemId) return
    set({
      updatingItemId: inventoryItemId,
      message: 'Usando el consumible...',
    })
    try {
      const response = await useInventoryItem(inventoryItemId)
      set({
        character: response.data.character,
        inventory: response.data.inventory,
        playerDefeated: response.data.character.health <= 0,
        healEvent: {
          amount: response.data.healedAmount,
          itemName: 'Poción menor',
          id: Date.now(),
        },
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible usar el consumible.',
      })
    } finally {
      set({ updatingItemId: null })
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

  equipItem: async (inventoryItemId) => {
    if (get().updatingItemId) return
    set({ updatingItemId: inventoryItemId, message: 'Ajustando el equipo...' })
    try {
      const response = await equipItemRequest(inventoryItemId)
      set({
        character: response.data.character,
        inventory: response.data.inventory,
        equipment: response.data.equipment,
        message: 'Equipo actualizado. Tus estadísticas han aumentado.',
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible equipar el objeto.',
      })
    } finally {
      set({ updatingItemId: null })
    }
  },

  unequipItem: async (inventoryItemId) => {
    if (get().updatingItemId) return
    set({ updatingItemId: inventoryItemId, message: 'Retirando el objeto...' })
    try {
      const response = await unequipItemRequest(inventoryItemId)
      set({
        character: response.data.character,
        inventory: response.data.inventory,
        equipment: response.data.equipment,
        message: 'Objeto desequipado y estadísticas recalculadas.',
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible desequipar el objeto.',
      })
    } finally {
      set({ updatingItemId: null })
    }
  },
}))
