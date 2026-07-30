const typeLabels = {
  weapon: 'Arma',
  helmet: 'Casco',
  armor: 'Armadura',
  boots: 'Botas',
  necklace: 'Collar',
  ring: 'Anillo',
  artifact: 'Artefacto',
  consumable: 'Consumible',
  material: 'Material',
  quest: 'Misión',
}

const rarityLabels = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
}

const bonusLabels = {
  attack: 'ATQ',
  defense: 'DEF',
  health: 'HP',
  crit: 'CRIT',
  evasion: 'EVA',
  agility: 'AGI',
  power: 'POD',
}

function ItemBonuses({ bonuses = {} }) {
  const active = Object.entries(bonuses).filter(([, value]) => value)
  if (!active.length) return <span className="no-bonuses">Sin bonus de equipo</span>

  return (
    <div className="item-bonuses">
      {active.map(([stat, value]) => (
        <span key={stat}>
          +{stat === 'crit' || stat === 'evasion' ? `${Math.round(value * 100)}%` : value}{' '}
          {bonusLabels[stat]}
        </span>
      ))}
    </div>
  )
}

function ItemComparison({ comparison }) {
  if (!comparison) return null
  const visibleDeltas = COMPARISON_STATS.filter(
    ([stat]) => comparison.deltas[stat] !== 0,
  )

  return (
    <div
      className={[
        'item-comparison',
        comparison.recommended ? 'recommended' : 'lower',
      ].join(' ')}
    >
      <div>
        <strong>{comparison.label}</strong>
        <small>
          {comparison.slotEmpty
            ? 'Slot vacío'
            : `Frente a ${comparison.equippedItem.displayName ?? comparison.equippedItem.name}`}
        </small>
      </div>
      {visibleDeltas.length > 0 && (
        <div className="comparison-values">
          {visibleDeltas.map(([stat, label]) => (
            <span
              className={comparison.deltas[stat] > 0 ? 'positive' : 'negative'}
              key={stat}
            >
              {label}: {formatComparisonValue(stat, comparison.deltas[stat])}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Inventory({
  items,
  equipment,
  onEquip,
  onUnequip,
  onUse,
  updatingItemId,
}) {
  return (
    <aside className="inventory panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Mochila del héroe</span>
          <h2>Inventario</h2>
        </div>
        <span className="item-count">{items.length}/30</span>
      </div>

      <div className="inventory-list advanced">
        {items.map((item) => {
          const itemType = item.itemType ?? item.type?.toLowerCase()
          const rarity = item.rarity ?? 'common'
          const equipable = EQUIPABLE_TYPES.has(itemType)
          const consumable = itemType === 'consumable'
          const isUpdating = updatingItemId === item.inventoryItemId
          const comparison = getEquipmentComparison(item, equipment)

          return (
            <article className={`inventory-item rarity-${rarity}`} key={item.inventoryItemId ?? item.id}>
              <span className="item-icon">{item.name.charAt(0)}</span>
              <div className="item-details">
                <div className="item-name-row">
                  <strong>{item.displayName ?? item.name}</strong>
                  <b>×{item.quantity}</b>
                </div>
                <div className="item-meta">
                  <span>{typeLabels[itemType] ?? itemType}</span>
                  <i>{rarityLabels[rarity] ?? rarity}</i>
                  {item.equipped && <em>Equipado</em>}
                </div>
                <ItemBonuses bonuses={item.bonuses} />
                <ItemComparison comparison={comparison} />
              </div>
              {(equipable || consumable) && (
                <button
                  className={`item-action ${item.equipped ? 'unequip' : ''} ${consumable ? 'consume' : ''}`}
                  type="button"
                  onClick={() =>
                    consumable
                      ? onUse(item.inventoryItemId)
                      : item.equipped
                      ? onUnequip(item.inventoryItemId)
                      : onEquip(item.inventoryItemId)
                  }
                  disabled={isUpdating || (consumable && item.quantity <= 0)}
                >
                  {isUpdating
                    ? '...'
                    : consumable
                      ? item.quantity > 0 ? 'Usar poción' : 'Agotado'
                      : item.equipped ? 'Quitar' : 'Equipar'}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </aside>
  )
}
import {
  COMPARISON_STATS,
  EQUIPABLE_TYPES,
  formatComparisonValue,
  getEquipmentComparison,
} from '../utils/equipmentComparison'
