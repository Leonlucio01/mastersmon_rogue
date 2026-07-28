const Stat = ({ label, value, tone }) => (
  <div className="hud-stat">
    <span className={`hud-dot ${tone}`} />
    <span className="hud-stat__label">{label}</span>
    <strong>{value}</strong>
  </div>
)

export default function Hud({ character, isAuthenticated, onLogin, onLogout }) {
  return (
    <header className="hud">
      <div className="player-badge">
        <span className="player-badge__mark">M</span>
        <div>
          <span className="eyebrow">{character.class ?? 'Explorador'} · Nv. {character.level}</span>
          <strong>{character.name}</strong>
        </div>
      </div>
      <div className="hud-stats" aria-label="Recursos del personaje">
        <Stat label="Oro" value={character.gold} tone="gold" />
        <Stat label="Gemas" value={character.gems} tone="gem" />
        <Stat
          label="Energía"
          value={`${character.energy}/${character.maxEnergy}`}
          tone="energy"
        />
        <Stat label="Poder" value={character.power} tone="power" />
      </div>
      <div className="hud-account">
        <span>{character.experience} EXP</span>
        <button type="button" onClick={isAuthenticated ? onLogout : onLogin}>
          {isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión'}
        </button>
      </div>
    </header>
  )
}
