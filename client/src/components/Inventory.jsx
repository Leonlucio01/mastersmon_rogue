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

const equipableTypes = new Set([
  'weapon',
  'helmet',
  'armor',
  'boots',
  'necklace',
  'ring',
  'artifact',
])

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

export default function Inventory({
  items,
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
          const equipable = equipableTypes.has(itemType)
          const consumable = itemType === 'consumable'
          const isUpdating = updatingItemId === item.inventoryItemId

          return (
            <article className={`inventory-item rarity-${rarity}`} key={item.inventoryItemId ?? item.id}>
              <span className="item-icon">{item.name.charAt(0)}</span>
              <div className="item-details">
                <div className="item-name-row">
                  <strong>{item.name}</strong>
                  <b>×{item.quantity}</b>
                </div>
                <div className="item-meta">
                  <span>{typeLabels[itemType] ?? itemType}</span>
                  <i>{rarityLabels[rarity] ?? rarity}</i>
                  {item.equipped && <em>Equipado</em>}
                </div>
                <ItemBonuses bonuses={item.bonuses} />
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
