function formatDuration(seconds = 0) {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) return `${hours} h ${minutes} min`
  return `${totalMinutes} min`
}

function formatLastFarm(value) {
  if (!value) return 'Sin actividad registrada'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function OfflineRewards({
  status,
  isOpen,
  isClaiming,
  onClaim,
  onClose,
  onOpen,
}) {
  const drops = status?.drops ?? []

  return (
    <>
      <section className="panel offline-summary">
        <div>
          <span className="eyebrow">Farmeo offline</span>
          <strong>{formatLastFarm(status?.calculatedAt)}</strong>
          <small>Máximo 4 h acumulables · 1 intento cada 2 min</small>
        </div>
        {status?.hasRewards && (
          <button type="button" onClick={onOpen}>
            Ver botín
            <span>{status.attempts}</span>
          </button>
        )}
      </section>

      {isOpen && status?.hasRewards && (
        <div className="offline-overlay" role="presentation">
          <section
            className="offline-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-title"
          >
            <button
              className="offline-close"
              type="button"
              onClick={onClose}
              aria-label="Cerrar recompensas offline"
            >
              ×
            </button>

            <div className="offline-rune">✦</div>
            <span className="eyebrow">El sendero trabajó por ti</span>
            <h2 id="offline-title">Recompensas offline</h2>
            <p>
              Tus exploradores recorrieron {status.zoneName} durante{' '}
              <strong>{formatDuration(status.offlineSeconds)}</strong>.
            </p>

            <div className="offline-attempts">
              <span>Intentos de farmeo</span>
              <strong>{status.attempts}</strong>
            </div>

            <div className="offline-reward-grid">
              <article>
                <span>◉</span>
                <small>Oro</small>
                <strong>+{status.gold}</strong>
              </article>
              <article>
                <span>✧</span>
                <small>Experiencia</small>
                <strong>+{status.experience}</strong>
              </article>
            </div>

            <div className="offline-drops">
              <span className="eyebrow">Objetos encontrados</span>
              {drops.length > 0 ? (
                <ul>
                  {drops.map((drop) => (
                    <li key={drop.itemId}>
                      <span>{drop.name}</span>
                      <strong>×{drop.quantity}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No se encontraron objetos esta vez.</p>
              )}
            </div>

            {status.limitApplied && (
              <p className="offline-limit">
                Se aplicó el límite máximo de 4 horas.
              </p>
            )}

            <button
              className="offline-claim"
              type="button"
              onClick={onClaim}
              disabled={isClaiming}
            >
              {isClaiming ? 'Guardando botín...' : 'Reclamar recompensas'}
            </button>
          </section>
        </div>
      )}
    </>
  )
}
