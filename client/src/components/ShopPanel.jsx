import { useState } from 'react'
import {
  COMPARISON_STATS,
  formatComparisonValue,
  getEquipmentComparison,
} from '../utils/equipmentComparison'

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

function ShopItemCard({
  item,
  mode,
  gold,
  busyKey,
  equipment,
  onBuy,
  onSell,
}) {
  const buying = mode === 'buy'
  const actionKey = buying ? `buy:${item.id}` : `sell:${item.inventoryItemId}`
  const price = buying ? item.buyPrice : item.sellPrice
  const blocked =
    busyKey ||
    (buying
      ? gold < price || item.stock === 0
      : !item.canSell)
  const comparison = buying
    ? getEquipmentComparison(item, equipment)
    : null

  return (
    <article className={`shop-item rarity-${item.rarity}`}>
      <span className="shop-item__icon">{item.name.charAt(0)}</span>
      <div className="shop-item__body">
        <div className="shop-item__name">
          <strong>{item.displayName ?? item.name}</strong>
          {!buying && <b>×{item.quantity}</b>}
        </div>
        <div className="shop-item__meta">
          <span>{typeLabels[item.itemType] ?? item.itemType}</span>
          <i>{rarityLabels[item.rarity] ?? item.rarity}</i>
          {item.equipped && <em>Equipado</em>}
        </div>
        {item.sellBlockedReason && (
          <small>{item.sellBlockedReason}</small>
        )}
        {comparison && (
          <div
            className={`shop-comparison ${comparison.recommended ? 'recommended' : 'lower'}`}
          >
            <strong>{comparison.label}</strong>
            <small>
              {comparison.slotEmpty
                ? 'Slot vacío'
                : `vs. ${comparison.equippedItem.displayName ?? comparison.equippedItem.name}`}
            </small>
            <div>
              {COMPARISON_STATS.filter(
                ([stat]) => comparison.deltas[stat] !== 0,
              ).map(([stat, label]) => (
                <span
                  className={comparison.deltas[stat] > 0 ? 'positive' : 'negative'}
                  key={stat}
                >
                  {label} {formatComparisonValue(stat, comparison.deltas[stat])}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() =>
          buying ? onBuy(item.id) : onSell(item.inventoryItemId)
        }
        disabled={Boolean(blocked)}
      >
        <span>◉ {price}</span>
        {busyKey === actionKey
          ? 'Procesando...'
          : buying
            ? gold < price
              ? 'Sin oro'
              : 'Comprar'
            : item.equipped
              ? 'Equipado'
              : 'Vender'}
      </button>
    </article>
  )
}

export default function ShopPanel({
  shop,
  isOpen,
  isLoading,
  busyKey,
  onOpen,
  onClose,
  onBuy,
  onSell,
}) {
  const [tab, setTab] = useState('buy')
  const buying = tab === 'buy'
  const list = buying ? shop.items : shop.sellableInventory

  return (
    <>
      <section className="panel shop-summary">
        <div className="shop-portrait" aria-hidden="true">R</div>
        <div>
          <span className="eyebrow">Puesto del sendero</span>
          <strong>Mercader Rowan</strong>
          <small>Compra suministros para tu aventura</small>
        </div>
        <button type="button" onClick={onOpen}>
          Tienda
        </button>
      </section>

      {isOpen && (
        <div className="shop-overlay" role="presentation">
          <section
            className="shop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-title"
          >
            <header className="shop-header">
              <div className="shop-portrait shop-portrait--large">R</div>
              <div>
                <span className="eyebrow">Mercader itinerante</span>
                <h2 id="shop-title">{shop.merchant.name}</h2>
                <p>“{shop.merchant.message}”</p>
              </div>
              <div className="shop-gold">
                <small>Tu oro</small>
                <strong>◉ {shop.gold}</strong>
              </div>
              <button
                className="shop-close"
                type="button"
                onClick={onClose}
                aria-label="Cerrar tienda"
              >
                ×
              </button>
            </header>

            <nav className="shop-tabs" aria-label="Opciones de la tienda">
              <button
                type="button"
                className={buying ? 'active' : ''}
                onClick={() => setTab('buy')}
              >
                Comprar
              </button>
              <button
                type="button"
                className={!buying ? 'active' : ''}
                onClick={() => setTab('sell')}
              >
                Vender
              </button>
            </nav>

            <div className="shop-list">
              {isLoading ? (
                <p className="shop-empty">Rowan está ordenando sus mercancías...</p>
              ) : list.length > 0 ? (
                list.map((item) => (
                  <ShopItemCard
                    key={buying ? item.id : item.inventoryItemId}
                    item={item}
                    mode={tab}
                    gold={shop.gold}
                    busyKey={busyKey}
                    equipment={shop.equipment}
                    onBuy={onBuy}
                    onSell={onSell}
                  />
                ))
              ) : (
                <p className="shop-empty">
                  {buying
                    ? 'No hay mercancías disponibles.'
                    : 'No tienes objetos que Rowan pueda comprar.'}
                </p>
              )}
            </div>

            <footer className="shop-footer">
              Los objetos equipados deben retirarse antes de venderlos.
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
