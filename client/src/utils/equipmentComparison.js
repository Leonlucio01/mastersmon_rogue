export const EQUIPABLE_TYPES = new Set([
  'weapon',
  'helmet',
  'armor',
  'boots',
  'necklace',
  'ring',
  'artifact',
])

export const COMPARISON_STATS = [
  ['attack', 'Ataque'],
  ['defense', 'Defensa'],
  ['health', 'Vida'],
  ['power', 'Poder'],
  ['crit', 'Crítico'],
  ['evasion', 'Evasión'],
  ['agility', 'Agilidad'],
]

function valueFor(item, stat) {
  return Number(item?.bonuses?.[stat] ?? 0)
}

export function getEquipmentComparison(item, equipment = {}) {
  const slot = item.itemType ?? item.type?.toLowerCase()
  if (!EQUIPABLE_TYPES.has(slot) || item.equipped) return null

  const equippedItem = equipment?.[slot] ?? null
  const deltas = Object.fromEntries(
    COMPARISON_STATS.map(([stat]) => [
      stat,
      valueFor(item, stat) - valueFor(equippedItem, stat),
    ]),
  )
  const slotEmpty = !equippedItem
  const relevantImprovement =
    deltas.power > 0 ||
    deltas.attack >= 2 ||
    deltas.defense >= 2 ||
    deltas.health >= 10 ||
    deltas.crit >= 0.02 ||
    deltas.evasion >= 0.02
  const recommended = slotEmpty || relevantImprovement

  return {
    slot,
    slotEmpty,
    equippedItem,
    deltas,
    recommended,
    label: slotEmpty
      ? 'Mejora recomendada'
      : recommended
        ? 'Recomendado'
        : deltas.power < 0
          ? 'Menor poder'
          : 'Cambio lateral',
  }
}

export function formatComparisonValue(stat, value) {
  const prefix = value > 0 ? '+' : ''
  if (stat === 'crit' || stat === 'evasion') {
    return `${prefix}${Math.round(value * 100)}%`
  }
  return `${prefix}${value}`
}
