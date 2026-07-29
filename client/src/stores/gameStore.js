import { create } from 'zustand'
import {
  attackEnemy,
  buyShopItem as buyShopItemRequest,
  claimOfflineRewards as claimOfflineRewardsRequest,
  claimQuest as claimQuestRequest,
  equipItem as equipItemRequest,
  getCharacter,
  getEquipment,
  getHealth,
  getMapCurrent,
  getMapZones,
  getOfflineStatus,
  getQuests,
  getSkills,
  getShop,
  nextMapMonster,
  restCharacter,
  selectMapZone,
  sellShopItem as sellShopItemRequest,
  unequipItem as unequipItemRequest,
  useBattleSkill,
  useInventoryItem,
} from '../services/api'

const fallbackCharacter = {
  name: 'Kael',
  class: 'Vanguardia',
  level: 1,
  experience: 0,
  gold: 35,
  gems: 2,
  energy: 80,
  maxEnergy: 80,
  power: 15,
  attack: 16,
  defense: 4,
  health: 110,
  maxHealth: 110,
}

const fallbackInventory = [
  { inventoryItemId: 'demo-potion', id: 'potion', name: 'Poción menor', quantity: 2, type: 'CONSUMABLE', itemType: 'consumable', rarity: 'common', equipped: false, healAmount: 30, bonuses: {} },
  { inventoryItemId: 'demo-sword', id: 'sword', name: 'Espada de aprendiz', quantity: 1, type: 'WEAPON', itemType: 'weapon', rarity: 'common', equipped: true, slot: 'weapon', bonuses: { attack: 4, power: 5 } },
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
  health: 32,
  maxHealth: 32,
  defense: 1,
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
      { id: 'demo-2', name: 'Lobo joven', order: 2, isBoss: false },
      { id: 'demo-3', name: 'Goblin errante', order: 3, isBoss: false },
      { id: 'demo-4', name: 'Guardián de Raíz', order: 4, isBoss: true },
    ],
  },
  {
    id: 'shadow-mine',
    name: 'Mina Umbría',
    description: 'Galerías olvidadas bajo la montaña.',
    order: 2,
    requiredLevel: 3,
    requiredPower: 22,
    unlocked: false,
    available: false,
    meetsRequirements: false,
    selected: false,
    completed: false,
    currentMonsterOrder: 1,
    totalMonsters: 4,
    monsters: [
      { id: 'demo-5', name: 'Murciélago de hollín', order: 1, isBoss: false },
      { id: 'demo-6', name: 'Minero corrupto', order: 2, isBoss: false },
      { id: 'demo-7', name: 'Araña de cueva', order: 3, isBoss: false },
      { id: 'demo-8', name: 'Gólem Umbrío', order: 4, isBoss: true },
    ],
  },
]

const fallbackSkills = [
  { id: 'basic', name: 'Ataque básico', description: 'Golpe fiable.', skillType: 'basic', damageMultiplier: 1, critBonus: 0, energyCost: 0, cooldownTurns: 0, cooldownRemaining: 0, requiredLevel: 1, icon: '⚔', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'swift', name: 'Corte veloz', description: 'Ataque rápido.', skillType: 'damage', damageMultiplier: 1.2, critBonus: 0, energyCost: 10, cooldownTurns: 1, cooldownRemaining: 0, requiredLevel: 1, icon: '≋', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'shadow', name: 'Golpe sombrío', description: 'Golpe de alto daño.', skillType: 'damage', damageMultiplier: 1.8, critBonus: 0.2, energyCost: 24, cooldownTurns: 3, cooldownRemaining: 0, requiredLevel: 1, icon: '☾', evasionBonus: 0, durationTurns: 0, activeTurns: 0 },
  { id: 'evade', name: 'Paso evasivo', description: 'Aumenta la evasión.', skillType: 'buff', damageMultiplier: 0, critBonus: 0, energyCost: 12, cooldownTurns: 3, cooldownRemaining: 0, requiredLevel: 1, icon: '◇', evasionBonus: 0.3, durationTurns: 2, activeTurns: 0 },
]

const fallbackQuests = [
  {
    id: 'quest-slimes',
    title: 'Derrota 3 Slimes musgosos',
    description: 'Limpia el inicio del Sendero Esmeralda.',
    requiredAmount: 3,
    progress: 0,
    completed: false,
    claimed: false,
    status: 'in_progress',
    isMainQuest: true,
    reward: {
      gold: 30,
      experience: 30,
      item: { name: 'Poción menor', quantity: 2 },
    },
  },
  {
    id: 'quest-guardian',
    title: 'Derrota al Guardián de Raíz',
    description: 'Vence al guardián ancestral del sendero.',
    requiredAmount: 1,
    progress: 0,
    completed: false,
    claimed: false,
    status: 'in_progress',
    isMainQuest: true,
    reward: {
      gold: 75,
      experience: 60,
      item: { name: 'Anillo del cazador', quantity: 1 },
    },
  },
]

const emptyOfflineStatus = {
  id: null,
  hasRewards: false,
  zoneName: null,
  offlineSeconds: 0,
  attempts: 0,
  gold: 0,
  experience: 0,
  drops: [],
  limitApplied: false,
  defeated: false,
  calculatedAt: null,
  lastSeenAt: null,
  maxOfflineSeconds: 14400,
  maxOfflineHours: 4,
  attemptIntervalSeconds: 120,
}

const emptyShop = {
  merchant: {
    name: 'Mercader Rowan',
    message: 'Compra suministros para tu aventura',
  },
  gold: fallbackCharacter.gold,
  items: [],
  sellableInventory: [],
}

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
    quests: result.quests ?? state.quests,
    questNotice: result.completedQuests?.length
      ? {
          message: `¡Misión completada: ${result.completedQuests[0].title}!`,
          type: 'completed',
          id: Date.now() + 3,
        }
      : state.questNotice,
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
  quests: fallbackQuests,
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
  questNotice: null,
  offlineStatus: emptyOfflineStatus,
  offlineModalOpen: false,
  offlineNotice: null,
  isClaimingOffline: false,
  shop: emptyShop,
  shopOpen: false,
  isShopLoading: false,
  shopBusyKey: null,
  shopNotice: null,
  claimingQuestId: null,
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
      questNotice: null,
      offlineNotice: null,
      shopNotice: null,
      unlockNotice: '',
    })

    try {
      await getHealth()
      const [characterResponse, equipmentResponse, zonesResponse, mapResponse, skillsResponse, questsResponse, offlineResponse] =
        await Promise.all([
          getCharacter(),
          getEquipment(),
          getMapZones(),
          getMapCurrent(),
          getSkills(),
          getQuests(),
          getOfflineStatus().catch(() => ({ data: emptyOfflineStatus })),
        ])
      const current = mapResponse.data

      set({
        character: equipmentResponse.data.character ?? characterResponse.data,
        inventory: equipmentResponse.data.inventory,
        equipment: equipmentResponse.data.equipment,
        skills: skillsResponse.data.skills,
        quests: questsResponse.data.quests,
        offlineStatus: offlineResponse.data,
        offlineModalOpen: offlineResponse.data.hasRewards,
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
        quests: fallbackQuests,
        offlineStatus: emptyOfflineStatus,
        offlineModalOpen: false,
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

  refreshOfflineRewards: async () => {
    if (!get().serverOnline) return
    try {
      const response = await getOfflineStatus()
      set((state) => ({
        offlineStatus: response.data,
        offlineModalOpen:
          response.data.hasRewards && !state.offlineStatus.hasRewards
            ? true
            : state.offlineModalOpen,
      }))
    } catch {
      // El resto del juego debe seguir disponible si falla esta consulta auxiliar.
    }
  },

  closeOfflineModal: () => set({ offlineModalOpen: false }),
  openOfflineModal: () => {
    if (get().offlineStatus.hasRewards) set({ offlineModalOpen: true })
  },

  claimOfflineRewards: async () => {
    if (get().isClaimingOffline) return
    set({ isClaimingOffline: true })
    try {
      const response = await claimOfflineRewardsRequest()
      set({
        character: response.data.character,
        inventory: response.data.inventory,
        offlineStatus: response.data.status,
        offlineModalOpen: false,
        offlineNotice: {
          message: `Farmeo reclamado: +${response.data.claimed.gold} oro · +${response.data.claimed.experience} EXP`,
          id: Date.now(),
        },
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ??
          'No fue posible reclamar el farmeo offline.',
      })
    } finally {
      set({ isClaimingOffline: false })
    }
  },

  openShop: async () => {
    if (get().isShopLoading) return
    set({ shopOpen: true, isShopLoading: true })
    try {
      const response = await getShop()
      set({ shop: response.data })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible abrir la tienda.',
      })
    } finally {
      set({ isShopLoading: false })
    }
  },

  closeShop: () => set({ shopOpen: false }),

  buyShopItem: async (shopItemId) => {
    if (get().shopBusyKey) return
    const busyKey = `buy:${shopItemId}`
    set({ shopBusyKey: busyKey })
    try {
      const response = await buyShopItemRequest(shopItemId)
      set({
        shop: response.data,
        character: response.data.character,
        inventory: response.data.inventory,
        equipment: response.data.equipment,
        shopNotice: {
          message: `Compra realizada: ${response.data.transaction.itemName} · −${response.data.transaction.totalGold} oro`,
          id: Date.now(),
        },
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible completar la compra.',
      })
    } finally {
      set({ shopBusyKey: null })
    }
  },

  sellShopItem: async (inventoryItemId) => {
    if (get().shopBusyKey) return
    const busyKey = `sell:${inventoryItemId}`
    set({ shopBusyKey: busyKey })
    try {
      const response = await sellShopItemRequest(inventoryItemId)
      set({
        shop: response.data,
        character: response.data.character,
        inventory: response.data.inventory,
        equipment: response.data.equipment,
        shopNotice: {
          message: `Venta realizada: ${response.data.transaction.itemName} · +${response.data.transaction.totalGold} oro`,
          id: Date.now(),
        },
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible completar la venta.',
      })
    } finally {
      set({ shopBusyKey: null })
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
        quests: current.quests ?? state.quests,
        questNotice: current.completedQuests?.length
          ? {
              message: `¡Misión completada: ${current.completedQuests[0].title}!`,
              type: 'completed',
              id: Date.now(),
            }
          : state.questNotice,
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

  claimQuest: async (characterQuestId) => {
    if (get().claimingQuestId) return
    set({
      claimingQuestId: characterQuestId,
      message: 'Entregando la misión...',
    })
    try {
      const response = await claimQuestRequest(characterQuestId)
      set({
        character: response.data.character,
        inventory: response.data.inventory,
        quests: response.data.quests,
        questNotice: {
          message: `Recompensa reclamada: +${response.data.rewards.gold} oro · +${response.data.rewards.experience} EXP`,
          type: 'claimed',
          id: Date.now(),
        },
        message: response.data.message,
      })
    } catch (error) {
      set({
        message:
          error.response?.data?.error ?? 'No fue posible reclamar la misión.',
      })
    } finally {
      set({ claimingQuestId: null })
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
