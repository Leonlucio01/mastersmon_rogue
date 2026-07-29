export const MAX_UPGRADE_LEVEL = 5
export const UPGRADE_COSTS = [0, 25, 50, 90, 140, 210]

export const EQUIPABLE_ITEM_TYPES = new Set([
  'WEAPON',
  'HELMET',
  'ARMOR',
  'BOOTS',
  'NECKLACE',
  'RING',
  'ARTIFACT',
])

const statKeys = [
  'attack',
  'defense',
  'health',
  'crit',
  'evasion',
  'agility',
  'power',
]

function roundRate(value) {
  return Math.round(value * 10000) / 10000
}

function baseBonuses(item) {
  return {
    attack: item.attackBonus,
    defense: item.defenseBonus,
    health: item.healthBonus,
    crit: item.critBonus,
    evasion: item.evasionBonus,
    agility: item.agilityBonus,
    power: item.powerBonus,
  }
}

function scaledBonuses(item, level) {
  const multiplier = 1 + level * 0.1
  const base = baseBonuses(item)
  return {
    attack: Math.round(base.attack * multiplier),
    defense: Math.round(base.defense * multiplier),
    health: Math.round(base.health * multiplier),
    crit: roundRate(base.crit * multiplier),
    evasion: roundRate(base.evasion * multiplier),
    agility: Math.round(base.agility * multiplier),
    power: Math.round(base.power * multiplier),
  }
}

export function isUpgradeableItem(item) {
  return EQUIPABLE_ITEM_TYPES.has(item.type)
}

export function getBaseItemBonuses(item) {
  return baseBonuses(item)
}

export function getUpgradedItemBonuses(item, rawLevel = 0) {
  const level = Math.min(
    MAX_UPGRADE_LEVEL,
    Math.max(0, Math.floor(rawLevel)),
  )
  let fallbackPower = 0
  let previous = scaledBonuses(item, 0)

  for (let step = 1; step <= level; step += 1) {
    const current = scaledBonuses(item, step)
    const improved = statKeys.some(
      (stat) => current[stat] > previous[stat],
    )
    if (!improved) fallbackPower += 1
    previous = current
  }

  return {
    ...previous,
    power: previous.power + fallbackPower,
  }
}

export function getNextUpgradeCost(currentLevel) {
  if (currentLevel >= MAX_UPGRADE_LEVEL) return null
  return UPGRADE_COSTS[currentLevel + 1]
}

export function getUpgradeInvestment(level) {
  const safeLevel = Math.min(
    MAX_UPGRADE_LEVEL,
    Math.max(0, Math.floor(level)),
  )
  return UPGRADE_COSTS.slice(1, safeLevel + 1).reduce(
    (total, cost) => total + cost,
    0,
  )
}

export function getUpgradeSellBonus(level) {
  return Math.floor(getUpgradeInvestment(level) * 0.3)
}
