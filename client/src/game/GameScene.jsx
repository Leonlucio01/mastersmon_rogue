import { ContactShadows, Float } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import RogueActor from './RogueActor'

function actionType(skillName = '') {
  if (skillName.includes('Corte veloz')) return 'swift'
  if (skillName.includes('Golpe sombrío')) return 'shadow'
  if (skillName.includes('Paso evasivo')) return 'evade'
  return 'basic'
}

function Enemy({ defeated, impactKey, critical }) {
  const group = useRef()
  const material = useRef()
  const hitTime = useRef(0)
  const defeatProgress = useRef(0)

  useEffect(() => {
    if (impactKey) hitTime.current = critical ? 0.48 : 0.34
  }, [impactKey, critical])

  useFrame((_, delta) => {
    if (!group.current) return
    hitTime.current = Math.max(0, hitTime.current - delta)
    defeatProgress.current = THREE.MathUtils.lerp(
      defeatProgress.current,
      defeated ? 1 : 0,
      Math.min(1, delta * 3.8),
    )
    const shake =
      hitTime.current > 0
        ? Math.sin(hitTime.current * (critical ? 125 : 85)) *
          (critical ? 0.18 : 0.1)
        : 0
    const fall = defeatProgress.current

    group.current.position.x = 1.65 + shake
    group.current.position.y = 0.2 - fall * 0.58
    group.current.rotation.z = shake * 0.4 + fall * 1.05
    group.current.scale.set(1 + fall * 0.12, 1 - fall * 0.72, 1 + fall * 0.12)

    if (material.current) {
      material.current.opacity = 1 - fall * 0.82
      material.current.emissive.set(
        hitTime.current > 0
          ? critical
            ? '#7d4b00'
            : '#5c1b1b'
          : '#000000',
      )
      material.current.emissiveIntensity = hitTime.current > 0 ? 1.7 : 0
    }
  })

  return (
    <Float
      speed={defeated ? 0 : 2}
      rotationIntensity={defeated ? 0 : 0.12}
      floatIntensity={defeated ? 0 : 0.25}
    >
      <group ref={group} position={[1.65, 0.2, 0]}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.72, 32, 24]} />
          <meshStandardMaterial
            ref={material}
            color={defeated ? '#516057' : '#a3e635'}
            roughness={0.7}
            transparent
          />
        </mesh>
        {!defeated && (
          <>
            <mesh position={[-0.22, 0.72, 0.61]} scale={[0.08, 0.12, 0.06]}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshStandardMaterial color="#172019" />
            </mesh>
            <mesh position={[0.22, 0.72, 0.61]} scale={[0.08, 0.12, 0.06]}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshStandardMaterial color="#172019" />
            </mesh>
          </>
        )}
      </group>
    </Float>
  )
}

function SkillEffect({ isAttacking, actionSkill, actionKey }) {
  const slashOne = useRef()
  const slashTwo = useRef()
  const shadowOrb = useRef()
  const elapsed = useRef(0)
  const kind = actionType(actionSkill)

  useEffect(() => {
    elapsed.current = 0
  }, [actionKey])

  useFrame((_, delta) => {
    if (isAttacking) elapsed.current += delta
    const duration = kind === 'shadow' ? 0.72 : 0.52
    const progress = Math.min(1, elapsed.current / duration)

    for (const [index, mesh] of [slashOne.current, slashTwo.current].entries()) {
      if (!mesh) continue
      const offset = index * 0.2
      const local = Math.max(0, Math.min(1, (progress - offset) / 0.42))
      const visible = isAttacking && (kind === 'swift' || kind === 'basic') && local < 1
      mesh.material.opacity = visible ? Math.sin(local * Math.PI) * 0.9 : 0
      mesh.scale.setScalar(0.7 + local * 0.65)
      mesh.rotation.z = -0.9 + local * 1.4 + index * 0.35
    }

    if (shadowOrb.current) {
      const visible = isAttacking && kind === 'shadow'
      shadowOrb.current.material.opacity = visible
        ? Math.sin(progress * Math.PI) * 0.5
        : 0
      shadowOrb.current.scale.setScalar(0.25 + progress * 1.25)
      shadowOrb.current.rotation.y += delta * 3
    }
  })

  return (
    <group position={[1.18, 0.9, 0.28]}>
      <mesh ref={slashOne} rotation={[0, 0, -0.9]}>
        <torusGeometry args={[0.58, 0.035, 8, 42, Math.PI * 1.25]} />
        <meshBasicMaterial
          color={kind === 'swift' ? '#8ff8ff' : '#e8ffad'}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={slashTwo} rotation={[0, 0, -0.5]} position={[0.08, 0.04, 0.04]}>
        <torusGeometry args={[0.72, 0.025, 8, 42, Math.PI * 1.15]} />
        <meshBasicMaterial
          color="#65e6ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={shadowOrb}>
        <icosahedronGeometry args={[0.72, 2]} />
        <meshBasicMaterial
          color="#7c3aed"
          wireframe
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function ImpactParticles({ impactKey, critical, hasDamage }) {
  const meshes = useRef([])
  const elapsed = useRef(1)
  const vectors = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        return new THREE.Vector3(
          Math.cos(angle),
          Math.sin(angle) * 0.7 + 0.15,
          Math.sin(angle * 2) * 0.35,
        )
      }),
    [],
  )

  useEffect(() => {
    if (impactKey && hasDamage) elapsed.current = 0
  }, [impactKey, hasDamage])

  useFrame((_, delta) => {
    elapsed.current += delta
    const progress = Math.min(1, elapsed.current / 0.55)
    meshes.current.forEach((mesh, index) => {
      if (!mesh) return
      mesh.visible = progress < 1
      mesh.position.copy(vectors[index]).multiplyScalar(progress * (critical ? 1.05 : 0.7))
      mesh.material.opacity = (1 - progress) * 0.9
      mesh.scale.setScalar((1 - progress) * (critical ? 0.13 : 0.09))
    })
  })

  return (
    <group position={[1.65, 0.86, 0.35]}>
      {vectors.map((_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            meshes.current[index] = mesh
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color={critical ? '#ffd166' : '#d9ff8f'}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

function CameraEffects({ impactKey, critical, counterKey, playerEvaded }) {
  const { camera } = useThree()
  const base = useRef(camera.position.clone())
  const shakeTime = useRef(0)
  const intensity = useRef(0)

  useEffect(() => {
    if (impactKey) {
      shakeTime.current = critical ? 0.34 : 0.12
      intensity.current = critical ? 0.09 : 0.025
    }
  }, [impactKey, critical])

  useEffect(() => {
    if (counterKey && !playerEvaded) {
      shakeTime.current = 0.2
      intensity.current = 0.045
    }
  }, [counterKey, playerEvaded])

  useFrame((_, delta) => {
    shakeTime.current = Math.max(0, shakeTime.current - delta)
    if (shakeTime.current > 0) {
      camera.position.x =
        base.current.x + Math.sin(shakeTime.current * 110) * intensity.current
      camera.position.y =
        base.current.y + Math.cos(shakeTime.current * 95) * intensity.current
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, base.current.x, 0.28)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, base.current.y, 0.28)
    }
  })

  return null
}

function World({
  enemyDefeated,
  playerDefeated,
  isAttacking,
  actionSkill,
  actionKey,
  impactKey,
  lastHit,
  lastCounter,
  evasiveActive,
}) {
  return (
    <>
      <color attach="background" args={['#101e22']} />
      <fog attach="fog" args={['#101e22', 7, 13]} />
      <ambientLight intensity={1.4} />
      <directionalLight castShadow intensity={2.4} position={[-3, 7, 5]} shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={['#bceaff', '#19382b', 0.8]} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color="#294a3a" roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
        <planeGeometry args={[5.8, 2.8]} />
        <meshStandardMaterial color="#49644a" roughness={1} />
      </mesh>

      <RogueActor
        isAttacking={isAttacking}
        actionSkill={actionSkill}
        actionKey={actionKey}
        defeated={playerDefeated}
        evasiveActive={evasiveActive}
        lastCounter={lastCounter}
      />
      <Enemy
        defeated={enemyDefeated}
        impactKey={impactKey}
        critical={Boolean(lastHit?.wasCritical)}
      />
      <SkillEffect
        isAttacking={isAttacking}
        actionSkill={actionSkill}
        actionKey={actionKey}
      />
      <ImpactParticles
        impactKey={impactKey}
        critical={Boolean(lastHit?.wasCritical)}
        hasDamage={Boolean(lastHit?.damage)}
      />
      <CameraEffects
        impactKey={impactKey}
        critical={Boolean(lastHit?.wasCritical)}
        counterKey={lastCounter?.id}
        playerEvaded={Boolean(lastCounter?.evaded)}
      />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={9} blur={2.6} far={4} />
    </>
  )
}

export default function GameScene({
  enemyDefeated,
  playerDefeated,
  isAttacking,
  actionSkill,
  actionKey,
  impactKey,
  enemyName,
  lastHit,
  lastCounter,
  evasiveActive,
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      orthographic
      camera={{ position: [5.5, 4.5, 7], zoom: 72, near: 0.1, far: 100 }}
      aria-label={`Escena de combate contra ${enemyName}`}
    >
      <Suspense fallback={null}>
        <World
          enemyDefeated={enemyDefeated}
          playerDefeated={playerDefeated}
          isAttacking={isAttacking}
          actionSkill={actionSkill}
          actionKey={actionKey}
          impactKey={impactKey}
          lastHit={lastHit}
          lastCounter={lastCounter}
          evasiveActive={evasiveActive}
        />
      </Suspense>
    </Canvas>
  )
}
