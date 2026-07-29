import { useEffect, useState } from 'react'
import Hud from '../components/Hud'
import EquipmentPanel from '../components/EquipmentPanel'
import Inventory from '../components/Inventory'
import MapPanel from '../components/MapPanel'
import OfflineRewards from '../components/OfflineRewards'
import QuestPanel from '../components/QuestPanel'
import ShopPanel from '../components/ShopPanel'
import SkillBar from '../components/SkillBar'
import GameScene from '../game/GameScene'
import {
  isCombatSoundEnabled,
  playCombatEvent,
  playHealingSound,
  setCombatSoundEnabled,
} from '../services/combatAudio'
import { touchOfflineActivity } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'

function HealthBar({ value, max, tone = 'enemy' }) {
  const percentage = Math.max(0, (value / max) * 100)

  return (
    <div className={`health health--${tone}`}>
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
    equipment,
    skills,
    quests,
    activeEffects,
    enemy,
    zones,
    currentZone,
    progress,
    serverOnline,
    persistence,
    isLoading,
    isAttacking,
    isChangingEnemy,
    isSelectingZone,
    isResting,
    updatingItemId,
    message,
    lastHit,
    lastCounter,
    playerDefeated,
    activeSkillName,
    actionKey,
    combatEvent,
    healEvent,
    questNotice,
    offlineStatus,
    offlineModalOpen,
    offlineNotice,
    isClaimingOffline,
    shop,
    shopOpen,
    isShopLoading,
    shopBusyKey,
    shopNotice,
    claimingQuestId,
    rewards,
    canAdvance,
    zoneComplete,
    unlockNotice,
    impactKey,
    loadGame,
    useSkill,
    rest,
    useItem,
    advanceEnemy,
    selectZone,
    claimQuest,
    refreshOfflineRewards,
    closeOfflineModal,
    openOfflineModal,
    claimOfflineRewards,
    openShop,
    closeShop,
    buyShopItem,
    sellShopItem,
    equipItem,
    unequipItem,
  } = useGameStore()
  const { token, logout, openAuth } = useAuthStore()
  const [soundEnabled, setSoundEnabled] = useState(isCombatSoundEnabled)

  useEffect(() => {
    loadGame()
  }, [loadGame, token])

  useEffect(() => {
    playCombatEvent(combatEvent)
  }, [combatEvent])

  useEffect(() => {
    if (healEvent) playHealingSound()
  }, [healEvent])

  useEffect(() => {
    if (!serverOnline) return undefined

    const touchActivity = () => {
      touchOfflineActivity().catch(() => {})
    }
    const handleVisibility = () => {
      if (document.hidden) {
        touchActivity()
      } else {
        refreshOfflineRewards()
      }
    }
    const intervalId = window.setInterval(() => {
      if (!document.hidden) touchActivity()
    }, 60_000)

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', touchActivity)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', touchActivity)
    }
  }, [refreshOfflineRewards, serverOnline])

  const enemyDefeated = enemy.health <= 0
  const evasiveActive = activeEffects.some(
    (effect) => effect.name === 'Paso evasivo' && effect.activeTurns > 0,
  )
  const actionClass = activeSkillName
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
  const shouldRest =
    playerDefeated || character.health < character.maxHealth * 0.5
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

      {questNotice && (
        <div
          key={questNotice.id}
          className={`quest-notice quest-notice--${questNotice.type}`}
        >
          <span>✦</span>
          {questNotice.message}
        </div>
      )}

      {offlineNotice && (
        <div
          key={offlineNotice.id}
          className="quest-notice quest-notice--claimed"
        >
          <span>☾</span>
          {offlineNotice.message}
        </div>
      )}

      {shopNotice && (
        <div
          key={shopNotice.id}
          className="quest-notice quest-notice--claimed"
        >
          <span>◉</span>
          {shopNotice.message}
        </div>
      )}

      <section className="game-layout">
        <div className="world-card">
          <div className="world-meta">
            <div>
              <span className="eyebrow">
                Zona {String(currentZone.order ?? 1).padStart(2, '0')} · {progress.label}
              </span>
              <h1>{currentZone.name}</h1>
            </div>
            <div className="world-status-actions">
              <button
                className={`sound-toggle ${soundEnabled ? 'enabled' : ''}`}
                type="button"
                onClick={() => {
                  const next = !soundEnabled
                  setCombatSoundEnabled(next)
                  setSoundEnabled(next)
                }}
                aria-pressed={soundEnabled}
                title="Activar o desactivar sonidos de combate"
              >
                {soundEnabled ? '♪ Sonido' : '♩ Silencio'}
              </button>
              <span className={`server-status ${serverOnline ? 'online' : ''}`}>
                <i />
                {isLoading
                  ? 'Conectando'
                  : serverOnline
                    ? persistence === 'database' ? 'PostgreSQL activo' : 'Servidor · demo'
                    : 'Modo demo'}
              </span>
            </div>
          </div>

          <div
            className={[
              'scene-wrap',
              isAttacking ? 'is-attacking' : '',
              `action-${actionClass}`,
              playerDefeated ? 'player-is-defeated' : '',
              enemyDefeated ? 'enemy-is-defeated' : '',
              evasiveActive ? 'evasive-active' : '',
            ].filter(Boolean).join(' ')}
          >
            <GameScene
              enemyDefeated={enemyDefeated}
              playerDefeated={playerDefeated}
              isAttacking={isAttacking}
              actionSkill={activeSkillName}
              actionKey={actionKey}
              impactKey={impactKey}
              enemyName={enemy.name}
              lastHit={lastHit}
              lastCounter={lastCounter}
              evasiveActive={evasiveActive}
            />

            {lastHit?.wasCritical && (
              <div key={`critical-${lastHit.id}`} className="critical-flash" />
            )}

            {evasiveActive && (
              <div className="scene-buff-indicator">
                <span>◇</span>
                Paso evasivo activo
              </div>
            )}

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
                <span>ATQ {enemy.attack ?? enemy.power ?? 0}</span>
              </div>
            </div>

            <div className={`player-health-card panel ${playerDefeated ? 'defeated' : ''}`}>
              <div className="player-health-card__head">
                <span className="eyebrow">Vida del aventurero</span>
                <strong>{playerDefeated ? 'DERROTADO' : character.name}</strong>
              </div>
              <HealthBar
                value={character.health}
                max={character.maxHealth}
                tone="player"
              />
              <small>
                DEF {character.defense} · EVA {Math.round(character.evasion * 100)}%
              </small>
            </div>

            {lastHit && (
              <div key={lastHit.id} className={`floating-damage ${lastHit.wasCritical ? 'critical' : ''}`}>
                {lastHit.wasCritical && <small>CRÍTICO</small>}
                <strong>−{lastHit.damage}</strong>
                {lastHit.skillName && <em>{lastHit.skillName}</em>}
              </div>
            )}

            {lastCounter && (
              <div
                key={lastCounter.id}
                className={`floating-counter ${lastCounter.evaded ? 'evaded' : ''}`}
              >
                {lastCounter.evaded ? (
                  <strong>ESQUIVASTE</strong>
                ) : (
                  <>
                    <small>DAÑO RECIBIDO</small>
                    <strong>−{lastCounter.damage}</strong>
                  </>
                )}
              </div>
            )}

            {healEvent && (
              <div key={healEvent.id} className="floating-heal">
                <small>{healEvent.itemName}</small>
                <strong>+{healEvent.amount} HP</strong>
              </div>
            )}

            <RewardBanner rewards={rewards} />

            {playerDefeated && (
              <div className="defeat-overlay">
                <span>☠</span>
                <strong>HAS SIDO DERROTADO</strong>
                <small>Descansa o usa una poción para volver al combate</small>
              </div>
            )}

            <div className="battle-controls">
              <p className={playerDefeated ? 'defeat-message' : ''}>{message}</p>
              <div className="battle-actions">
                {enemyDefeated && canAdvance ? (
                  <button
                    className="attack-button next-button"
                    type="button"
                    onClick={advanceEnemy}
                    disabled={isChangingEnemy}
                  >
                    <span>➜</span>
                    {isChangingEnemy
                      ? 'Rastreando...'
                      : 'Siguiente enemigo'}
                  </button>
                ) : enemyDefeated && zoneComplete ? (
                  <div className="zone-complete-callout">
                    <span>✦</span>
                    Zona completada · Selecciona la siguiente ruta en el mapa
                  </div>
                ) : null}
                {shouldRest && (
                  <button
                    className="rest-button"
                    type="button"
                    onClick={rest}
                    disabled={isResting}
                  >
                    <span>⌂</span>
                    {isResting ? 'Descansando...' : 'Descansar'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {!enemyDefeated && (
            <SkillBar
              skills={skills}
              character={character}
              activeEffects={activeEffects}
              isAttacking={isAttacking}
              onUse={useSkill}
            />
          )}
        </div>

        <div className="side-column">
          <ShopPanel
            shop={shop}
            isOpen={shopOpen}
            isLoading={isShopLoading}
            busyKey={shopBusyKey}
            onOpen={openShop}
            onClose={closeShop}
            onBuy={buyShopItem}
            onSell={sellShopItem}
          />
          <OfflineRewards
            status={offlineStatus}
            isOpen={offlineModalOpen}
            isClaiming={isClaimingOffline}
            onClaim={claimOfflineRewards}
            onClose={closeOfflineModal}
            onOpen={openOfflineModal}
          />
          <MapPanel
            zones={zones}
            currentZoneId={currentZone.id}
            onSelect={selectZone}
            isSelecting={isSelectingZone}
            unlockNotice={unlockNotice}
          />
          <QuestPanel
            quests={quests}
            onClaim={claimQuest}
            claimingQuestId={claimingQuestId}
          />
          <EquipmentPanel
            equipment={equipment}
            onUnequip={unequipItem}
            updatingItemId={updatingItemId}
          />
          <Inventory
            items={inventory}
            onEquip={equipItem}
            onUnequip={unequipItem}
            onUse={useItem}
            updatingItemId={updatingItemId}
          />
          <section className="panel mission-card">
            <span className="eyebrow">{enemy.isBoss ? 'Desafío de zona' : 'Objetivo activo'}</span>
            <h2>{enemy.isBoss ? 'Combate contra el boss' : progress.label}</h2>
            <p>
              {enemy.isBoss
                ? `Derrota a ${enemy.name} para conquistar ${currentZone.name}.`
                : `Derrota a ${enemy.name} y avanza hacia el boss.`}
            </p>
            <div className="character-combat-stats">
              <span>ATQ <b>{character.attack ?? character.power}</b></span>
              <span>DEF <b>{character.defense ?? 0}</b></span>
              <span>HP <b>{character.maxHealth ?? 100}</b></span>
              <span>CRIT <b>{Math.round((character.critRate ?? 0.1) * 100)}%</b></span>
            </div>
            <div className="mission-progress">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    ((progress.currentMonsterOrder - (enemyDefeated ? 0 : 1)) /
                      progress.totalMonsters) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
