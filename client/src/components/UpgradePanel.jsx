const typeLabels = {
  weapon: 'Arma',
  helmet: 'Casco',
  armor: 'Armadura',
  boots: 'Botas',
  necklace: 'Collar',
  ring: 'Anillo',
  artifact: 'Artefacto',
}

const rarityLabels = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
}

const statLabels = {
  attack: 'ATQ',
  defense: 'DEF',
  health: 'HP',
  crit: 'CRIT',
  evasion: 'EVA',
  agility: 'AGI',
  power: 'POD',
}

function formatStat(stat, value) {
  if (stat === 'crit' || stat === 'evasion') {
    return `${Math.round(value * 100)}%`
  }
  return value
}

function StatPreview({ item }) {
  const rows = Object.entries(item.currentStats).filter(
    ([stat, current]) =>
      current !== 0 || (item.nextStats?.[stat] ?? 0) !== 0,
  )

  return (
    <div className="upgrade-stats">
      {rows.map(([stat, current]) => {
        const next = item.nextStats?.[stat]
        const improved = next != null && next > current
        return (
          <span key={stat} className={improved ? 'will-improve' : ''}>
            <small>{statLabels[stat]}</small>
            <b>+{formatStat(stat, current)}</b>
            {next != null && (
              <>
                <i>→</i>
                <strong>+{formatStat(stat, next)}</strong>
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}

export default function UpgradePanel({
  upgrade,
  isOpen,
  isLoading,
  upgradingItemId,
  onOpen,
  onClose,
  onUpgrade,
}) {
  return (
    <>
      <section className="panel upgrade-summary">
        <div className="upgrade-emblem" aria-hidden="true">✦</div>
        <div>
          <span className="eyebrow">Forja del aventurero</span>
          <strong>Mejora de equipo</strong>
          <small>Refuerza tus objetos hasta +5</small>
        </div>
        <button type="button" onClick={onOpen}>Mejorar</button>
      </section>

      {isOpen && (
        <div className="upgrade-overlay" role="presentation">
          <section
            className="upgrade-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            <header className="upgrade-header">
              <div className="upgrade-emblem upgrade-emblem--large">✦</div>
              <div>
                <span className="eyebrow">Forja arcana</span>
                <h2 id="upgrade-title">Mejorar equipo</h2>
                <p>Mejoras garantizadas · máximo +5</p>
              </div>
              <div className="upgrade-gold">
                <small>Tu oro</small>
                <strong>◉ {upgrade.gold}</strong>
              </div>
              <button
                className="upgrade-close"
                type="button"
                onClick={onClose}
                aria-label="Cerrar mejora"
              >
                ×
              </button>
            </header>

            <div className="upgrade-list">
              {isLoading ? (
                <p className="upgrade-empty">Preparando la forja...</p>
              ) : upgrade.items.length > 0 ? (
                upgrade.items.map((item) => {
                  const lacksGold =
                    !item.maxed && upgrade.gold < item.nextUpgradeCost
                  const busy = upgradingItemId === item.inventoryItemId
                  return (
                    <article
                      className={`upgrade-item rarity-${item.rarity}`}
                      key={item.inventoryItemId}
                    >
                      <div className="upgrade-item__top">
                        <span className="upgrade-item__icon">
                          {item.name.charAt(0)}
                        </span>
                        <div>
                          <strong>{item.displayName}</strong>
                          <span>
                            {typeLabels[item.slot] ?? item.slot} ·{' '}
                            {rarityLabels[item.rarity] ?? item.rarity}
                            {item.equipped ? ' · Equipado' : ''}
                          </span>
                        </div>
                        <b>+{item.upgradeLevel}</b>
                      </div>

                      <StatPreview item={item} />

                      <button
                        type="button"
                        onClick={() => onUpgrade(item.inventoryItemId)}
                        disabled={item.maxed || lacksGold || Boolean(upgradingItemId)}
                      >
                        {item.maxed
                          ? 'Máximo +5'
                          : busy
                            ? 'Mejorando...'
                            : lacksGold
                              ? `Faltan ${item.nextUpgradeCost - upgrade.gold} oro`
                              : `Mejorar a +${item.upgradeLevel + 1} · ◉ ${item.nextUpgradeCost}`}
                      </button>
                    </article>
                  )
                })
              ) : (
                <p className="upgrade-empty">
                  No tienes equipo que pueda mejorarse.
                </p>
              )}
            </div>

            <footer className="upgrade-footer">
              Cada nivel aumenta 10% los bonus base; la forja añade 1 POD
              cuando el redondeo no produciría una mejora.
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
