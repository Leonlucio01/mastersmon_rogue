function formatMultiplier(skill) {
  if (skill.skillType === 'buff') {
    return `+${Math.round(skill.evasionBonus * 100)}% evasión`
  }
  return `Daño ×${skill.damageMultiplier}`
}

export default function SkillBar({
  skills,
  character,
  activeEffects,
  isAttacking,
  onUse,
}) {
  return (
    <section className="skill-panel panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Artes de combate</span>
          <h2>Habilidades</h2>
        </div>
        <span className="skill-energy">
          Energía <b>{character.energy}/{character.maxEnergy}</b>
        </span>
      </div>

      {activeEffects.length > 0 && (
        <div className="active-effects">
          {activeEffects.map((effect) => (
            <span key={effect.skillId}>
              {effect.icon} {effect.name} · {effect.activeTurns} turno(s)
            </span>
          ))}
        </div>
      )}

      <div className="skill-grid">
        {skills.map((skill) => {
          const noEnergy = character.energy < skill.energyCost
          const coolingDown = skill.cooldownRemaining > 0
          const locked = character.level < skill.requiredLevel
          const playerDefeated = character.health <= 0
          const disabled =
            isAttacking || noEnergy || coolingDown || locked || playerDefeated

          return (
            <button
              className={`skill-button skill-${skill.skillType} ${skill.activeTurns > 0 ? 'active' : ''}`}
              type="button"
              key={skill.id}
              onClick={() => onUse(skill)}
              disabled={disabled}
              title={skill.description}
            >
              <span className="skill-icon">{skill.icon}</span>
              <span className="skill-copy">
                <strong>{skill.name}</strong>
                <small>{formatMultiplier(skill)}</small>
              </span>
              <span className="skill-cost">
                {skill.energyCost > 0 ? `${skill.energyCost} EN` : 'Gratis'}
              </span>
              {coolingDown && (
                <span className="skill-cooldown">
                  {skill.cooldownRemaining}
                </span>
              )}
              {locked && (
                <span className="skill-lock">Nv. {skill.requiredLevel}</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
