import { useAnimations, useFBX } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const ROGUE_SCALE = 0.012
export const ROGUE_POSITION = [-1.7, 0.02, 0]
export const ROGUE_ROTATION = [0, Math.PI / 2, 0]

const ROGUE_MODELS = {
  idle: '/assets/models/characters/rogue/rogue%20fbx/rogue_idle.fbx',
  basic: '/assets/models/characters/rogue/rogue%20fbx/rogue_attack.fbx',
  swift: '/assets/models/characters/rogue/rogue%20fbx/rogue_run.fbx',
  shadow: '/assets/models/characters/rogue/rogue%20fbx/rogue_slash.fbx',
  evade: '/assets/models/characters/rogue/rogue%20fbx/rogue_run.fbx',
  hit: '/assets/models/characters/rogue/rogue%20fbx/rogue_hit.fbx',
  death: '/assets/models/characters/rogue/rogue%20fbx/rogue_death.fbx',
}

// Los archivos ligeros contienen el clip; slash aporta la malla visible.
const ROGUE_MESH_URL =
  '/assets/models/characters/rogue/rogue%20fbx/rogue_slash.fbx'

function actionType(skillName = '') {
  if (skillName.includes('Corte veloz')) return 'swift'
  if (skillName.includes('Golpe sombrío')) return 'shadow'
  if (skillName.includes('Paso evasivo')) return 'evade'
  return 'basic'
}

function GeometricRogue({ defeated, evasive }) {
  const bodyMaterial = useRef()

  useFrame(({ clock }) => {
    if (!bodyMaterial.current) return
    bodyMaterial.current.opacity = evasive
      ? 0.52 + Math.sin(clock.elapsedTime * 12) * 0.18
      : defeated
        ? 0.55
        : 1
  })

  return (
    <group>
      <mesh castShadow position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.36, 0.8, 8, 18]} />
        <meshStandardMaterial
          ref={bodyMaterial}
          color={defeated ? '#47727a' : '#38bdf8'}
          roughness={0.55}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color="#f5cfa9" roughness={0.65} />
      </mesh>
      {!defeated && (
        <>
          <mesh
            castShadow
            position={[-0.14, 1.72, 0.27]}
            scale={[0.05, 0.05, 0.04]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#082f49" />
          </mesh>
          <mesh
            castShadow
            position={[0.14, 1.72, 0.27]}
            scale={[0.05, 0.05, 0.04]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#082f49" />
          </mesh>
        </>
      )}
    </group>
  )
}

function RogueModel({ modelUrl, state, actionKey, evasive }) {
  const meshScene = useFBX(ROGUE_MESH_URL)
  const animationAsset = useFBX(modelUrl)
  const animations = animationAsset.animations
  const model = useMemo(() => {
    const instance = clone(meshScene)
    instance.traverse((object) => {
      if (!object.isMesh) return
      object.frustumCulled = false
      object.castShadow = true
      object.receiveShadow = true
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      const clonedMaterials = materials.map((material) => {
        const copy = material.clone()
        copy.userData.baseOpacity = copy.opacity
        return copy
      })
      object.material = Array.isArray(object.material)
        ? clonedMaterials
        : clonedMaterials[0]
    })
    return instance
  }, [meshScene])
  const { actions, names } = useAnimations(animations, model)

  useEffect(() => {
    const action = actions[names[0]]
    if (!action) return undefined

    action.reset()
    action.enabled = true
    action.clampWhenFinished = state === 'death'
    action.setLoop(
      state === 'death' ? THREE.LoopOnce : THREE.LoopRepeat,
      state === 'death' ? 1 : Infinity,
    )
    action.fadeIn(0.08).play()

    return () => action.fadeOut(0.08)
  }, [actionKey, actions, names, state])

  useFrame(({ clock }) => {
    const opacity = evasive
      ? 0.55 + Math.sin(clock.elapsedTime * 12) * 0.16
      : state === 'death'
        ? 0.72
        : 1
    model.traverse((object) => {
      if (!object.isMesh) return
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => {
        const baseOpacity = material.userData.baseOpacity ?? 1
        material.transparent = opacity < 1 || baseOpacity < 1
        material.opacity = baseOpacity * opacity
      })
    })
  })

  return (
    <primitive
      object={model}
      scale={ROGUE_SCALE}
      rotation={ROGUE_ROTATION}
    />
  )
}

class RogueModelBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('No se pudo cargar el modelo Rogue; se usa el fallback.', error)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

export default function RogueActor({
  isAttacking,
  actionSkill,
  actionKey,
  defeated,
  evasiveActive,
  lastCounter,
}) {
  const group = useRef()
  const auraMaterial = useRef()
  const actionTime = useRef(0)
  const [takingHit, setTakingHit] = useState(false)
  const kind = actionType(actionSkill)

  useEffect(() => {
    actionTime.current = 0
  }, [actionKey])

  useEffect(() => {
    if (!lastCounter?.id || lastCounter.evaded || lastCounter.damage <= 0) {
      return undefined
    }

    const startTimer = window.setTimeout(() => setTakingHit(true), 420)
    const endTimer = window.setTimeout(() => setTakingHit(false), 940)
    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(endTimer)
    }
  }, [lastCounter?.id, lastCounter?.damage, lastCounter?.evaded])

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    if (isAttacking) actionTime.current += delta

    const duration = kind === 'swift' ? 0.48 : kind === 'shadow' ? 0.72 : 0.58
    const progress = Math.min(1, actionTime.current / duration)
    let lunge = 0

    if (isAttacking) {
      if (kind === 'swift') {
        lunge = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.9
      } else if (kind === 'shadow') {
        lunge =
          progress < 0.42
            ? -Math.sin((progress / 0.42) * Math.PI) * 0.18
            : Math.sin(((progress - 0.42) / 0.58) * Math.PI) * 1.12
      } else if (kind === 'evade') {
        lunge = -Math.sin(progress * Math.PI) * 0.5
      } else {
        lunge = Math.sin(progress * Math.PI) * 0.76
      }
    }

    const targetY = defeated ? -0.28 : ROGUE_POSITION[1]
    group.current.position.x = ROGUE_POSITION[0] + lunge
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      targetY,
      Math.min(1, delta * 8),
    )
    group.current.position.z =
      kind === 'evade' && isAttacking
        ? ROGUE_POSITION[2] + Math.sin(progress * Math.PI) * 0.22
        : ROGUE_POSITION[2]
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      defeated ? -0.88 : -lunge * 0.1,
      Math.min(1, delta * 10),
    )

    const auraVisible = evasiveActive || (kind === 'evade' && isAttacking)
    if (auraMaterial.current) {
      auraMaterial.current.opacity = auraVisible
        ? 0.28 + Math.sin(clock.elapsedTime * 7) * 0.12
        : 0
    }
  })

  const evasive = kind === 'evade' && isAttacking
  const showGhost = evasive || evasiveActive
  const state = defeated
    ? 'death'
    : isAttacking
      ? kind
      : takingHit
        ? 'hit'
        : 'idle'
  const modelUrl = ROGUE_MODELS[state]
  const animationKey =
    state === 'hit' ? lastCounter?.id : state === 'idle' ? state : actionKey
  const fallback = (
    <GeometricRogue defeated={defeated} evasive={evasive} />
  )

  return (
    <group ref={group} position={ROGUE_POSITION}>
      {showGhost && (
        <>
          <mesh position={[-0.28, 0.9, -0.08]} scale={[0.9, 1, 0.9]}>
            <capsuleGeometry args={[0.36, 0.8, 8, 18]} />
            <meshBasicMaterial color="#63e6d5" transparent opacity={0.09} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <torusGeometry args={[0.68, 0.035, 8, 48]} />
            <meshBasicMaterial
              ref={auraMaterial}
              color="#67f4d1"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight
            color="#67f4d1"
            intensity={1.3}
            distance={3}
            position={[0, 0.8, 0]}
          />
        </>
      )}

      <RogueModelBoundary key={modelUrl} fallback={fallback}>
        <Suspense fallback={fallback}>
          <RogueModel
            modelUrl={modelUrl}
            state={state}
            actionKey={animationKey}
            evasive={evasive}
          />
        </Suspense>
      </RogueModelBoundary>
    </group>
  )
}
