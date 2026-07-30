import {
  COMPARISON_STATS,
  formatComparisonValue,
} from '../utils/equipmentComparison'

const slots = [
  ['weapon', 'Arma', '⚔'],
  ['helmet', 'Casco', '◆'],
  ['armor', 'Armadura', '▣'],
  ['boots', 'Botas', '⌁'],
  ['necklace', 'Collar', '◇'],
  ['ring', 'Anillo', '○'],
  ['artifact', 'Artefacto', '✦'],
]

function EquippedStats({ item }) {
  const active = COMPARISON_STATS.filter(
    ([stat]) => Number(item?.bonuses?.[stat] ?? 0) !== 0,
  )
  if (!active.length) return null

  return (
    <div className="equipped-stat-line">
      {active.map(([stat, label]) => (
        <span key={stat}>
          {label} {formatComparisonValue(stat, item.bonuses[stat])}
        </span>
      ))}
    </div>
  )
}

export default function EquipmentPanel({ equipment, onUnequip, updatingItemId }) {
  return (
    <section className="equipment-panel panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Carga de combate</span>
          <h2>Equipo</h2>
        </div>
        <span className="equipment-count">
          {Object.values(equipment).filter(Boolean).length}/7
        </span>
      </div>

      <div className="equipment-grid">
        {slots.map(([slot, label, glyph]) => {
          const item = equipment[slot]
          return (
            <div className={`equipment-slot ${item ? `filled rarity-${item.rarity}` : ''}`} key={slot}>
              <span className="slot-glyph">{glyph}</span>
              <div>
                <small>{label}</small>
                <strong>{item?.displayName ?? item?.name ?? 'Vacío'}</strong>
                {item && <EquippedStats item={item} />}
              </div>
              {item && (
                <button
                  type="button"
                  onClick={() => onUnequip(item.inventoryItemId)}
                  disabled={updatingItemId === item.inventoryItemId}
                  aria-label={`Desequipar ${item.name}`}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
