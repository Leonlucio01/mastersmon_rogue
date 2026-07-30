import { useEffect, useRef, useState } from 'react'
import AutoFarmControl from '../components/AutoFarmControl'
import Hud from '../components/Hud'
import EquipmentPanel from '../components/EquipmentPanel'
import Inventory from '../components/Inventory'
import MapPanel from '../components/MapPanel'
import OfflineRewards from '../components/OfflineRewards'
import QuestPanel from '../components/QuestPanel'
import ShopPanel from '../components/ShopPanel'
import SkillBar from '../components/SkillBar'
import UpgradePanel from '../components/UpgradePanel'
import ExplorationScene from '../game/exploration/ExplorationScene'
import GameScene from '../game/GameScene'
import { useAutoFarm } from '../hooks/useAutoFarm'
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
    <div className={`reward-banner ${rewards.reduced ? 'reduced' : ''}`}>
      <span className="eyebrow">
        {rewards.reduced
          ? 'Boss repetido · recompensa reducida'
          : 'Botín de victoria'}
      </span>
      <strong>+{rewards.gold} oro · +{rewards.experience} EXP</strong>
      {rewards.droppedItem && (
        <p>
          {rewards.droppedItem.bossDrop
            ? 'Botín de jefe obtenido'
            : 'Encontraste'}
          : {rewards.droppedItem.name} ×{rewards.droppedItem.quantity ?? 1}
        </p>
      )}
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
    replayingZoneId,
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
    dropNotice,
    combatLog,
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
    upgrade,
    upgradeOpen,
    isUpgradeLoading,
    upgradingItemId,
    upgradeNotice,
    claimingQuestId,
    rewards,
    canAdvance,
    zoneComplete,
    allContentCompleted,
    unlockNotice,
    impactKey,
    loadGame,
    attack,
    useSkill,
    rest,
    useItem,
    advanceEnemy,
    selectZone,
    replayZone,
    claimQuest,
    refreshOfflineRewards,
    closeOfflineModal,
    openOfflineModal,
    claimOfflineRewards,
    openShop,
    closeShop,
    buyShopItem,
    sellShopItem,
    openUpgrade,
    closeUpgrade,
    upgradeEquipment,
    equipItem,
    unequipItem,
  } = useGameStore()
  const { token, logout, openAuth, authOpen } = useAuthStore()
  const [soundEnabled, setSoundEnabled] = useState(isCombatSoundEnabled)
  const [viewMode, setViewMode] = useState('combat')
  const [encounterName, setEncounterName] = useState(null)
  const explorationPositions = useRef({})
  const explorationCollected = useRef(new Set())
  const previousToken = useRef(token)
  const autoFarm = useAutoFarm({
    attack,
    character,
    enemy,
    isAttacking,
  })

  useEffect(() => {
    loadGame()
  }, [loadGame, token])

  useEffect(() => {
    if (previousToken.current !== token) {
      autoFarm.stop()
      previousToken.current = token
    }
  }, [autoFarm.stop, token])

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
  const energyLow = character.energy <= character.maxEnergy * 0.25
  const energyEmpty = character.energy <= 0
  const healthLow = character.health < character.maxHealth * 0.4
  const shouldRest =
    playerDefeated ||
    character.health < character.maxHealth * 0.5 ||
    energyLow
  const currentZoneMonsters =
    zones.find((zone) => zone.id === currentZone.id)?.monsters ?? []
  const explorationControlsLocked =
    playerDefeated ||
    shopOpen ||
    upgradeOpen ||
    offlineModalOpen ||
    authOpen
  const sessionLogout = () => {
    autoFarm.stop()
    logout()
    window.setTimeout(loadGame, 0)
  }
  const handleSelectZone = async (zoneId) => {
    autoFarm.pauseForContext('zone')
    setEncounterName(null)
    setViewMode('combat')
    await selectZone(zoneId)
  }
  const handleReplayZone = async (zoneId) => {
    autoFarm.pauseForContext('replay')
    setEncounterName(null)
    setViewMode('combat')
    await replayZone(zoneId)
  }
  const handleViewMode = (mode) => {
    if (mode === 'explore') {
      autoFarm.stop()
      closeShop()
      closeUpgrade()
      closeOfflineModal()
    }
    setViewMode(mode)
  }
  const handleStartEncounter = (monster) => {
    if (monster.name !== enemy.name || enemy.isBoss || enemy.health <= 0) return
    setEncounterName(monster.name)
    setViewMode('combat')
  }
  const handleReturnToMap = () => {
    autoFarm.stop()
    setEncounterName(null)
    setViewMode('explore')
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

      {upgradeNotice && (
        <div
          key={upgradeNotice.id}
          className="quest-notice quest-notice--claimed"
        >
          <span>✦</span>
          {upgradeNotice.message}
        </div>
      )}

      {autoFarm.notice && (
        <div
          key={autoFarm.notice.id}
          className="quest-notice auto-farm-notice"
        >
          <span>⚔</span>
          {autoFarm.notice.message}
        </div>
      )}

      <section className={`game-layout ${viewMode === 'explore' ? 'exploration-layout' : ''}`}>
        <div className="world-card">
          <div className="world-meta">
            <div>
              <span className="eyebrow">
                Zona {String(currentZone.order ?? 1).padStart(2, '0')} · {progress.label}
              </span>
              <h1>{currentZone.name}</h1>
              {progress.replayMode && (
                <span className="farming-mode-badge">Modo farmeo</span>
              )}
            </div>
            <div className="world-status-actions">
              <div className="game-mode-tabs" aria-label="Modo de juego">
                <button
                  type="button"
                  className={viewMode === 'combat' ? 'active' : ''}
                  onClick={() => handleViewMode('combat')}
                >
                  ⚔ Combate
                </button>
                <button
                  type="button"
                  className={viewMode === 'explore' ? 'active' : ''}
                  onClick={() => handleViewMode('explore')}
                >
                  ◇ Explorar
                </button>
              </div>
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

          {viewMode === 'explore' ? (
            <ExplorationScene
              zone={currentZone}
              progress={{ ...progress, monsters: currentZoneMonsters }}
              enemy={enemy}
              controlsLocked={explorationControlsLocked}
              positionStore={explorationPositions}
              collectedStore={explorationCollected}
              canAdvance={canAdvance}
              isChangingEnemy={isChangingEnemy}
              playerDefeated={playerDefeated}
              onStartCombat={handleStartEncounter}
              onAdvanceEnemy={advanceEnemy}
              onReturnToCombat={() => handleViewMode('combat')}
            />
          ) : (
            <>
          <div
            className={[
              'scene-wrap',
              isAttacking ? 'is-attacking' : '',
              `action-${actionClass}`,
              playerDefeated ? 'player-is-defeated' : '',
              enemyDefeated ? 'enemy-is-defeated' : '',
              evasiveActive ? 'evasive-active' : '',
              autoFarm.status === 'active' ? 'auto-farm-active' : '',
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
              autoFarmActive={autoFarm.status === 'active'}
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

            <AutoFarmControl
              status={autoFarm.status}
              activity={autoFarm.activity}
              nextAttackSeconds={autoFarm.nextAttackSeconds}
              countdownProgress={autoFarm.countdownProgress}
              farmingMode={Boolean(progress.replayMode)}
              onToggle={autoFarm.toggle}
            />

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

            {dropNotice && (
              <div
                key={dropNotice.id}
                className={`drop-notice rarity-${dropNotice.rarity ?? 'common'} ${dropNotice.bossDrop ? 'boss-drop' : ''}`}
              >
                <span>{dropNotice.bossDrop ? '✦' : '◇'}</span>
                <div>
                  <small>
                    {dropNotice.bossDrop
                      ? 'Botín de jefe obtenido'
                      : 'Objeto encontrado'}
                  </small>
                  <strong>
                    {dropNotice.name} ×{dropNotice.quantity ?? 1}
                  </strong>
                </div>
              </div>
            )}

            {playerDefeated && (
              <div className="defeat-overlay">
                <span>☠</span>
                <strong>HAS SIDO DERROTADO</strong>
                <small>Descansa o usa una poción para volver al combate</small>
              </div>
            )}

            <div className="battle-controls">
              <p className={playerDefeated ? 'defeat-message' : ''}>{message}</p>
              {(energyLow || healthLow) && (
                <div className="combat-advice">
                  {energyEmpty ? (
                    <small className="energy-rest-hint">
                      Sin energía para habilidades. Usa ataque básico o descansa.
                    </small>
                  ) : energyLow ? (
                    <small className="energy-rest-hint">
                      Energía baja · Descansa para recuperar energía.
                    </small>
                  ) : null}
                  {healthLow && (
                    <small className="health-rest-hint">
                      Vida baja: considera usar una poción o descansar.
                    </small>
                  )}
                </div>
              )}
              <div className="battle-actions">
                {enemyDefeated && encounterName && (
                  <button
                    className="rest-button return-map-button"
                    type="button"
                    onClick={handleReturnToMap}
                  >
                    <span>◇</span>
                    Volver al mapa
                  </button>
                )}
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
                    {progress.replayMode
                      ? 'Farmeo completado · Puedes repetir otra zona'
                      : 'Zona completada · Selecciona la siguiente ruta en el mapa'}
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
              {combatLog.length > 0 && (
                <div className="combat-history" aria-label="Historial de combate">
                  {combatLog.map((entry) => (
                    <span
                      className={`combat-history__${entry.type}`}
                      key={entry.id}
                    >
                      {entry.text}
                    </span>
                  ))}
                </div>
              )}
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
            </>
          )}
        </div>

        {viewMode === 'combat' && (
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
          <UpgradePanel
            upgrade={upgrade}
            isOpen={upgradeOpen}
            isLoading={isUpgradeLoading}
            upgradingItemId={upgradingItemId}
            onOpen={openUpgrade}
            onClose={closeUpgrade}
            onUpgrade={upgradeEquipment}
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
            onSelect={handleSelectZone}
            onReplay={handleReplayZone}
            isSelecting={isSelectingZone}
            replayingZoneId={replayingZoneId}
            unlockNotice={unlockNotice}
            allContentCompleted={allContentCompleted}
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
            equipment={equipment}
            onEquip={equipItem}
            onUnequip={unequipItem}
            onUse={useItem}
            updatingItemId={updatingItemId}
          />
          <section className="panel mission-card">
            <span className="eyebrow">
              {progress.replayMode
                ? 'Modo farmeo'
                : enemy.isBoss
                  ? 'Desafío de zona'
                  : 'Objetivo activo'}
            </span>
            <h2>{enemy.isBoss ? 'Combate contra el boss' : progress.label}</h2>
            <p>
              {progress.replayMode
                ? enemy.isBoss
                  ? 'Boss repetido: recompensa reducida y sin botín único.'
                  : 'Recompensas normales en enemigos de esta expedición.'
                : enemy.isBoss
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
        )}
      </section>
    </main>
  )
}
