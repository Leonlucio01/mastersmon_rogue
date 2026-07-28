import { useEffect } from 'react'
import Hud from '../components/Hud'
import Inventory from '../components/Inventory'
import GameScene from '../game/GameScene'
import { useGameStore } from '../stores/gameStore'

function HealthBar({ value, max }) {
  const percentage = Math.max(0, (value / max) * 100)

  return (
    <div className="health">
      <div className="health__copy">
        <span>Vitalidad</span>
        <strong>
          {value} / {max}
        </strong>
      </div>
      <div className="health__track">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default function Game() {
  const {
    character,
    inventory,
    enemy,
    serverOnline,
    isLoading,
    isAttacking,
    message,
    loadGame,
    attack,
  } = useGameStore()

  useEffect(() => {
    loadGame()
  }, [loadGame])

  const enemyDefeated = enemy.health <= 0

  return (
    <main className="game-shell">
      <Hud character={character} />

      <section className="game-layout">
        <div className="world-card">
          <div className="world-meta">
            <div>
              <span className="eyebrow">Zona 01</span>
              <h1>Sendero Esmeralda</h1>
            </div>
            <span className={`server-status ${serverOnline ? 'online' : ''}`}>
              <i />
              {isLoading ? 'Conectando' : serverOnline ? 'Servidor local' : 'Modo demo'}
            </span>
          </div>

          <div className={`scene-wrap ${isAttacking ? 'is-attacking' : ''}`}>
            <GameScene enemyDefeated={enemyDefeated} />

            <div className="enemy-card panel">
              <div className="enemy-card__head">
                <div>
                  <span className="eyebrow">Bestia salvaje</span>
                  <strong>{enemy.name}</strong>
                </div>
                <span>Nv. 1</span>
              </div>
              <HealthBar value={enemy.health} max={enemy.maxHealth} />
            </div>

            <div className="battle-controls">
              <p>{message}</p>
              <button
                className="attack-button"
                type="button"
                onClick={attack}
                disabled={isAttacking || enemyDefeated}
              >
                <span>{enemyDefeated ? '✓' : '⚔'}</span>
                {enemyDefeated
                  ? 'Enemigo vencido'
                  : isAttacking
                    ? 'Atacando...'
                    : 'Ataque básico'}
              </button>
            </div>
          </div>
        </div>

        <div className="side-column">
          <Inventory items={inventory} />
          <section className="panel mission-card">
            <span className="eyebrow">Objetivo activo</span>
            <h2>Primer encuentro</h2>
            <p>Derrota al Slime musgoso y despeja el sendero.</p>
            <div className="mission-progress">
              <span style={{ width: enemyDefeated ? '100%' : '35%' }} />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
