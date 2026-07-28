import { useEffect } from 'react'
import Hud from '../components/Hud'
import Inventory from '../components/Inventory'
import GameScene from '../game/GameScene'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'

function HealthBar({ value, max }) {
  const percentage = Math.max(0, (value / max) * 100)

  return (
    <div className="health">
      <div className="health__copy">
        <span>Vitalidad</span>
        <strong>{value} / {max}</strong>
      </div>
      <div className="health__track">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function RewardBanner({ rewards }) {
  if (!rewards) return null
  return (
    <div className="reward-banner">
      <span className="eyebrow">Botín de victoria</span>
      <strong>+{rewards.gold} oro · +{rewards.experience} EXP</strong>
      {rewards.droppedItem && <p>Objeto encontrado: {rewards.droppedItem.name}</p>}
    </div>
  )
}

export default function Game() {
  const {
    character,
    inventory,
    enemy,
    serverOnline,
    persistence,
    isLoading,
    isAttacking,
    isChangingEnemy,
    message,
    lastHit,
    rewards,
    nextEnemy,
    impactKey,
    loadGame,
    attack,
    advanceEnemy,
  } = useGameStore()
  const { token, logout, openAuth } = useAuthStore()

  useEffect(() => {
    loadGame()
  }, [loadGame, token])

  const enemyDefeated = enemy.health <= 0
  const sessionLogout = () => {
    logout()
    window.setTimeout(loadGame, 0)
  }

  return (
    <main className="game-shell">
      <Hud
        character={character}
        isAuthenticated={Boolean(token)}
        onLogin={openAuth}
        onLogout={sessionLogout}
      />

      <section className="game-layout">
        <div className="world-card">
          <div className="world-meta">
            <div>
              <span className="eyebrow">Zona 01</span>
              <h1>Sendero Esmeralda</h1>
            </div>
            <span className={`server-status ${serverOnline ? 'online' : ''}`}>
              <i />
              {isLoading
                ? 'Conectando'
                : serverOnline
                  ? persistence === 'database' ? 'PostgreSQL activo' : 'Servidor · demo'
                  : 'Modo demo'}
            </span>
          </div>

          <div className={`scene-wrap ${isAttacking ? 'is-attacking' : ''}`}>
            <GameScene
              enemyDefeated={enemyDefeated}
              isAttacking={isAttacking}
              impactKey={impactKey}
              enemyName={enemy.name}
            />

            <div className="enemy-card panel">
              <div className="enemy-card__head">
                <div>
                  <span className="eyebrow">{enemy.species ?? 'Bestia salvaje'}</span>
                  <strong>{enemy.name}</strong>
                </div>
                <span>Nv. {enemy.level ?? 1}</span>
              </div>
              <HealthBar value={enemy.health} max={enemy.maxHealth} />
              <div className="enemy-stats">
                <span>DEF {enemy.defense ?? 0}</span>
                <span>ATQ {enemy.power ?? 0}</span>
              </div>
            </div>

            {lastHit && (
              <div key={lastHit.id} className={`floating-damage ${lastHit.wasCritical ? 'critical' : ''}`}>
                {lastHit.wasCritical && <small>CRÍTICO</small>}
                <strong>−{lastHit.damage}</strong>
              </div>
            )}

            <RewardBanner rewards={rewards} />

            <div className="battle-controls">
              <p>{message}</p>
              {enemyDefeated ? (
                <button
                  className="attack-button next-button"
                  type="button"
                  onClick={advanceEnemy}
                  disabled={isChangingEnemy}
                >
                  <span>➜</span>
                  {isChangingEnemy
                    ? 'Rastreando...'
                    : nextEnemy
                      ? `Siguiente: ${nextEnemy.name}`
                      : 'Reiniciar expedición'}
                </button>
              ) : (
                <button
                  className="attack-button"
                  type="button"
                  onClick={attack}
                  disabled={isAttacking}
                >
                  <span>⚔</span>
                  {isAttacking ? 'Atacando...' : 'Ataque básico'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="side-column">
          <Inventory items={inventory} />
          <section className="panel mission-card">
            <span className="eyebrow">Objetivo activo</span>
            <h2>Primer encuentro</h2>
            <p>Derrota a {enemy.name} y reúne recursos para tu expedición.</p>
            <div className="character-combat-stats">
              <span>ATQ <b>{character.attack ?? character.power}</b></span>
              <span>DEF <b>{character.defense ?? 0}</b></span>
              <span>CRIT <b>{Math.round((character.critRate ?? 0.1) * 100)}%</b></span>
            </div>
            <div className="mission-progress">
              <span style={{ width: enemyDefeated ? '100%' : '35%' }} />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
