const statusLabels = {
  off: 'Apagado',
  active: 'Activo',
  'paused-defeated': 'Pausado por derrota',
  'paused-enemy': 'Pausado por enemigo derrotado',
  'paused-zone': 'Pausado por cambio de zona',
  'paused-replay': 'Pausado por cambio de zona',
}

export default function AutoFarmControl({
  status,
  activity,
  nextAttackSeconds,
  countdownProgress,
  farmingMode,
  onToggle,
}) {
  const active = status === 'active'
  const waitingForEnemy = status === 'paused-enemy'

  return (
    <section className={`auto-farm-control panel auto-farm--${status}`}>
      <div className="auto-farm-control__head">
        <div>
          <span className="eyebrow">Combate conectado</span>
          <strong>Auto-farm</strong>
        </div>
        <span className="auto-farm-status">
          <i />
          {statusLabels[status] ?? 'Apagado'}
        </span>
      </div>

      <p>{activity}</p>

      {active && (
        <div className="auto-farm-countdown">
          <div>
            <small>Próximo ataque</small>
            <b>{nextAttackSeconds || '…'}s</b>
          </div>
          <span>
            <i style={{ width: `${countdownProgress}%` }} />
          </span>
        </div>
      )}

      {farmingMode && (
        <small className="auto-farm-farming-hint">
          Modo farmeo activo: ideal para auto-farm.
        </small>
      )}

      <button type="button" onClick={onToggle}>
        <span>{active ? '■' : '▶'}</span>
        {active
          ? 'Detener auto-farm'
          : waitingForEnemy
            ? 'Desactivar'
            : 'Activar auto-farm'}
      </button>
    </section>
  )
}
