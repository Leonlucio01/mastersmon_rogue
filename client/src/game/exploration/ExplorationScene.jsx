import { ContactShadows } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import MapCollectible from './MapCollectible'
import MapMonster from './MapMonster'
import PlayerController from './PlayerController'
import ZoneMap from './ZoneMap'
import { getZoneMap } from './zoneMaps'

export default function ExplorationScene({
  zone,
  progress,
  enemy,
  controlsLocked,
  positionStore,
  collectedStore,
  canAdvance,
  isChangingEnemy,
  playerDefeated,
  onStartCombat,
  onAdvanceEnemy,
  onReturnToCombat,
}) {
  const config = getZoneMap(zone.name)
  const [nearbyId, setNearbyId] = useState(null)
  const [lootNotice, setLootNotice] = useState(null)
  const [collectedIds, setCollectedIds] = useState(
    () => new Set(collectedStore.current),
  )
  const monsters = useMemo(
    () =>
      config.monsters.map((spawn) => {
        const zoneMonster = progress.monsters?.find(
          (monster) => monster.order === spawn.order,
        )
        const id = zoneMonster?.id ?? `${zone.id}:${spawn.order}`
        const defeated =
          spawn.order < progress.currentMonsterOrder ||
          (spawn.order === progress.currentMonsterOrder && enemy.health <= 0)
        return {
          ...spawn,
          id,
          defeated,
          active:
            !enemy.isBoss &&
            spawn.order === progress.currentMonsterOrder &&
            enemy.name === spawn.name,
        }
      }),
    [
      config.monsters,
      enemy.health,
      enemy.isBoss,
      enemy.name,
      progress.currentMonsterOrder,
      progress.monsters,
      zone.id,
    ],
  )
  const collectibles = useMemo(
    () =>
      (config.collectibles ?? []).map((item) => {
        const sessionId = `${zone.id}:${item.id}`
        return {
          ...item,
          id: sessionId,
          kind: 'collectible',
          collected: collectedIds.has(sessionId),
        }
      }),
    [collectedIds, config.collectibles, zone.id],
  )
  const interactionTargets = useMemo(
    () => [
      ...monsters.map((monster) => ({ ...monster, kind: 'monster' })),
      ...collectibles,
    ],
    [collectibles, monsters],
  )
  const nearbyTarget = interactionTargets.find(
    (target) => target.id === nearbyId,
  )

  const interact = (targetId) => {
    const target = interactionTargets.find((entry) => entry.id === targetId)
    if (!target) return

    if (target.kind === 'collectible') {
      collectedStore.current.add(target.id)
      setCollectedIds(new Set(collectedStore.current))
      setNearbyId(null)
      setLootNotice({
        message: target.message,
        reward: target.reward,
        type: target.type,
        id: Date.now(),
      })
      return
    }

    if (target.active) onStartCombat(target)
  }

  useEffect(() => {
    if (!lootNotice) return undefined
    const timer = window.setTimeout(() => setLootNotice(null), 3600)
    return () => window.clearTimeout(timer)
  }, [lootNotice])

  return (
    <section className="exploration-wrap">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        orthographic
        camera={{ position: [4.8, 5.6, 6.4], zoom: 66, near: 0.1, far: 100 }}
        aria-label={`Mapa explorable de ${zone.name}`}
      >
        <Suspense fallback={null}>
          <ZoneMap config={config} />
          {monsters.map((monster) => (
            <MapMonster
              key={monster.id}
              monster={monster}
              accent={config.accent}
              nearby={monster.id === nearbyId}
              active={monster.active}
              defeated={monster.defeated}
            />
          ))}
          {collectibles.map((item) => (
            <MapCollectible
              key={item.id}
              item={item}
              accent={config.accent}
              nearby={item.id === nearbyId}
              collected={item.collected}
            />
          ))}
          <PlayerController
            config={config}
            interactionTargets={interactionTargets}
            controlsLocked={controlsLocked}
            positionStore={positionStore}
            zoneId={zone.id}
            onNearbyChange={setNearbyId}
            onInteract={interact}
          />
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.45}
            scale={14}
            blur={2.4}
            far={5}
          />
        </Suspense>
      </Canvas>

      {lootNotice && (
        <div
          key={lootNotice.id}
          className={`exploration-loot-notice loot-${lootNotice.type}`}
        >
          <span>{lootNotice.type === 'chest' ? '▣' : '✦'}</span>
          <div>
            <strong>{lootNotice.message}</strong>
            <small>{lootNotice.reward}</small>
            <em>Recompensa visual de esta sesión</em>
          </div>
        </div>
      )}

      <div className="exploration-help panel">
        <span className="eyebrow">Controles</span>
        <strong>WASD para moverte. E para interactuar.</strong>
        {controlsLocked && (
          <small>
            {playerDefeated
              ? 'Movimiento bloqueado: necesitas descansar.'
              : 'Movimiento pausado mientras hay un panel abierto.'}
          </small>
        )}
      </div>

      {nearbyTarget && (
        <div
          className={[
            'encounter-prompt',
            'panel',
            nearbyTarget.kind === 'collectible'
              ? 'collectible'
              : nearbyTarget.active
                ? 'active'
                : 'locked',
          ].join(' ')}
        >
          <span className="eyebrow">
            {nearbyTarget.kind === 'collectible'
              ? 'Objeto interactivo'
              : 'Encuentro cercano'}
          </span>
          <strong>{nearbyTarget.name}</strong>
          <p>
            {nearbyTarget.kind === 'collectible'
              ? 'Acércate y recoge esta recompensa temporal.'
              : nearbyTarget.active
                ? 'Este es el objetivo actual de tu progreso.'
                : 'Este enemigo aparecerá cuando avances en la zona.'}
          </p>
          <button
            type="button"
            disabled={
              controlsLocked ||
              (nearbyTarget.kind === 'monster' && !nearbyTarget.active)
            }
            onClick={() => interact(nearbyTarget.id)}
          >
            {nearbyTarget.kind === 'collectible'
              ? 'Recolectar · E'
              : nearbyTarget.active
                ? 'Iniciar combate · E'
                : 'Objetivo bloqueado'}
          </button>
        </div>
      )}

      {canAdvance && (
        <div className="exploration-result panel">
          <span>✦</span>
          <div>
            <strong>Objetivo derrotado</strong>
            <small>El encuentro desapareció del mapa.</small>
          </div>
          <button
            type="button"
            onClick={onAdvanceEnemy}
            disabled={isChangingEnemy}
          >
            {isChangingEnemy
              ? 'Rastreando...'
              : 'Rastrear siguiente enemigo'}
          </button>
        </div>
      )}

      {enemy.isBoss && (
        <div className="exploration-result boss panel">
          <span>◆</span>
          <div>
            <strong>El boss espera</strong>
            <small>Los bosses continúan en el modo de combate actual.</small>
          </div>
          <button type="button" onClick={onReturnToCombat}>
            Ir al combate
          </button>
        </div>
      )}
    </section>
  )
}
