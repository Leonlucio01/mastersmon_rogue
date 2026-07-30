const FUTURE_ZONES = [
  { order: 3, name: 'Ruinas Carmesí' },
  { order: 4, name: 'Bosque Sombrío' },
  { order: 5, name: 'Fortaleza del Vacío' },
]

function ZoneSteps({ zone }) {
  return (
    <div className="zone-steps" aria-label={`Progreso de ${zone.name}`}>
      {zone.monsters.map((monster) => {
        const complete = zone.replaying
          ? monster.order < zone.currentMonsterOrder
          : zone.completed || monster.order < zone.currentMonsterOrder
        const current =
          zone.selected &&
          monster.order === zone.currentMonsterOrder &&
          (!zone.completed || zone.replaying)
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
  onReplay,
  isSelecting,
  replayingZoneId,
  unlockNotice,
  allContentCompleted,
}) {
  const availableZoneNames = new Set(zones.map((zone) => zone.name))
  const futureZones = FUTURE_ZONES.filter(
    (zone) => !availableZoneNames.has(zone.name),
  )

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

      {allContentCompleted && (
        <div className="endgame-notice">
          <span className="eyebrow">Crónicas conquistadas</span>
          <strong>Contenido actual completado</strong>
          <p>
            Puedes seguir farmeando zonas completadas mientras se agregan
            nuevas regiones.
          </p>
        </div>
      )}

      <div className="zone-list">
        {zones.map((zone) => {
          const locked = !zone.unlocked
          const requirementLocked = zone.unlocked && !zone.meetsRequirements
          const replaying = replayingZoneId === zone.id
          return (
            <div className="zone-entry" key={zone.id}>
              <button
                className={[
                  'zone-card',
                  zone.id === currentZoneId ? 'selected' : '',
                  locked || requirementLocked ? 'locked' : '',
                  zone.completed ? 'completed' : '',
                  zone.replaying ? 'replaying' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                onClick={() => onSelect(zone.id)}
                disabled={
                  locked ||
                  requirementLocked ||
                  isSelecting ||
                  Boolean(replayingZoneId) ||
                  zone.id === currentZoneId
                }
              >
                <div className="zone-card__header">
                  <span>Zona {String(zone.order).padStart(2, '0')}</span>
                  <b>
                    {locked
                      ? 'Bloqueada'
                      : zone.replaying
                        ? 'Farmeando'
                        : zone.completed
                          ? 'Completada'
                          : zone.selected
                            ? 'Actual'
                            : 'Disponible'}
                  </b>
                </div>
                <strong>{zone.name}</strong>
                <p>{zone.description}</p>
                <ZoneSteps zone={zone} />
                {zone.replaying && (
                  <div className="replay-rules">
                    <span>Recompensas normales en enemigos</span>
                    <span>Boss con recompensa reducida</span>
                  </div>
                )}
                {(locked || requirementLocked) && (
                  <small>
                    {locked
                      ? 'Derrota al boss de la zona anterior'
                      : `Requiere Nv. ${zone.requiredLevel} · Poder ${zone.requiredPower}`}
                  </small>
                )}
              </button>

              {zone.completed && (
                <button
                  className="zone-replay-button"
                  type="button"
                  onClick={() => onReplay(zone.id)}
                  disabled={isSelecting || Boolean(replayingZoneId)}
                >
                  {replaying
                    ? 'Preparando expedición...'
                    : `Farmear ${zone.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {futureZones.length > 0 && (
        <div className="future-zones">
          <span className="eyebrow">Próximas regiones</span>
          <div className="future-zone-list">
            {futureZones.map((zone) => (
              <article className="future-zone-card" key={zone.name}>
                <span>Zona {String(zone.order).padStart(2, '0')}</span>
                <strong>{zone.name}</strong>
                <small>Próximamente</small>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
