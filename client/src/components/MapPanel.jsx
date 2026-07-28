function ZoneSteps({ zone }) {
  return (
    <div className="zone-steps" aria-label={`Progreso de ${zone.name}`}>
      {zone.monsters.map((monster) => {
        const complete =
          zone.completed || monster.order < zone.currentMonsterOrder
        const current =
          zone.selected && monster.order === zone.currentMonsterOrder
        return (
          <span
            key={monster.id}
            className={[
              complete ? 'complete' : '',
              current ? 'current' : '',
              monster.isBoss ? 'boss' : '',
            ].filter(Boolean).join(' ')}
            title={monster.name}
          >
            {monster.isBoss ? 'B' : monster.order}
          </span>
        )
      })}
    </div>
  )
}

export default function MapPanel({
  zones,
  currentZoneId,
  onSelect,
  isSelecting,
  unlockNotice,
}) {
  return (
    <section className="map-panel panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Atlas del reino</span>
          <h2>Mapa de zonas</h2>
        </div>
        <span className="map-compass">✦</span>
      </div>

      {unlockNotice && <div className="unlock-notice">{unlockNotice}</div>}

      <div className="zone-list">
        {zones.map((zone) => {
          const locked = !zone.unlocked
          const requirementLocked = zone.unlocked && !zone.meetsRequirements
          return (
            <button
              className={[
                'zone-card',
                zone.id === currentZoneId ? 'selected' : '',
                locked || requirementLocked ? 'locked' : '',
                zone.completed ? 'completed' : '',
              ].filter(Boolean).join(' ')}
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone.id)}
              disabled={locked || requirementLocked || isSelecting || zone.id === currentZoneId}
            >
              <div className="zone-card__header">
                <span>Zona {String(zone.order).padStart(2, '0')}</span>
                <b>{locked ? 'Bloqueada' : zone.completed ? 'Completada' : zone.selected ? 'Actual' : 'Disponible'}</b>
              </div>
              <strong>{zone.name}</strong>
              <p>{zone.description}</p>
              <ZoneSteps zone={zone} />
              {(locked || requirementLocked) && (
                <small>
                  {locked
                    ? 'Derrota al boss de la zona anterior'
                    : `Requiere Nv. ${zone.requiredLevel} · Poder ${zone.requiredPower}`}
                </small>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
