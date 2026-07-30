import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const CHIBI_URL =
  '/assets/models/characters/chibi_rogue/chibi_rogue_base.glb'
const INTERACTION_DISTANCE = 1.35
const MOVE_SPEED = 2.7

function ChibiExplorer({ moving }) {
  const { scene } = useGLTF(CHIBI_URL)
  const visual = useRef()
  const model = useMemo(() => {
    const instance = scene.clone(true)
    instance.traverse((object) => {
      if (!object.isMesh) return
      object.castShadow = true
      object.receiveShadow = true
      object.frustumCulled = false
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone()
    })
    return instance
  }, [scene])

  useFrame(({ clock }) => {
    if (!visual.current) return
    const speed = moving.current ? 10 : 3
    const amount = moving.current ? 0.07 : 0.025
    visual.current.position.y =
      0.02 + Math.abs(Math.sin(clock.elapsedTime * speed)) * amount
    visual.current.rotation.z =
      Math.sin(clock.elapsedTime * speed * 0.5) *
      (moving.current ? 0.035 : 0.012)
  })

  return (
    <group ref={visual} rotation={[0, Math.PI / 2, 0]} scale={0.82}>
      <primitive object={model} />
    </group>
  )
}

export default function PlayerController({
  config,
  interactionTargets,
  controlsLocked,
  positionStore,
  zoneId,
  onNearbyChange,
  onInteract,
}) {
  const group = useRef()
  const moving = useRef(false)
  const keys = useRef(new Set())
  const nearbyId = useRef(null)
  const onNearbyRef = useRef(onNearbyChange)
  const onInteractRef = useRef(onInteract)
  const { camera } = useThree()
  const initial = positionStore.current[zoneId] ?? config.spawn

  useEffect(() => {
    onNearbyRef.current = onNearbyChange
    onInteractRef.current = onInteract
  }, [onInteract, onNearbyChange])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (controlsLocked) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      const key = event.key.toLowerCase()
      if (['w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault()
        keys.current.add(key)
      }
      if (key === 'e' && nearbyId.current) {
        event.preventDefault()
        onInteractRef.current?.(nearbyId.current)
      }
    }
    const handleKeyUp = (event) => {
      keys.current.delete(event.key.toLowerCase())
    }
    const clearKeys = () => keys.current.clear()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearKeys)
      clearKeys()
    }
  }, [controlsLocked])

  useEffect(() => {
    if (controlsLocked) keys.current.clear()
  }, [controlsLocked])

  useFrame((_, delta) => {
    if (!group.current) return
    const direction = new THREE.Vector3(
      Number(keys.current.has('d')) - Number(keys.current.has('a')),
      0,
      Number(keys.current.has('s')) - Number(keys.current.has('w')),
    )
    moving.current = !controlsLocked && direction.lengthSq() > 0

    if (moving.current) {
      direction.normalize()
      group.current.position.addScaledVector(direction, MOVE_SPEED * delta)
      group.current.position.x = THREE.MathUtils.clamp(
        group.current.position.x,
        config.bounds.minX,
        config.bounds.maxX,
      )
      group.current.position.z = THREE.MathUtils.clamp(
        group.current.position.z,
        config.bounds.minZ,
        config.bounds.maxZ,
      )
      group.current.rotation.y = Math.atan2(direction.x, direction.z)
      positionStore.current[zoneId] = [
        group.current.position.x,
        group.current.position.z,
      ]
    }

    let closest = null
    let closestDistance = INTERACTION_DISTANCE
    for (const target of interactionTargets) {
      if (target.defeated || target.collected) continue
      const distance = Math.hypot(
        group.current.position.x - target.position[0],
        group.current.position.z - target.position[1],
      )
      if (distance < closestDistance) {
        closest = target
        closestDistance = distance
      }
    }
    const nextNearbyId = closest?.id ?? null
    if (nextNearbyId !== nearbyId.current) {
      nearbyId.current = nextNearbyId
      onNearbyRef.current?.(nextNearbyId)
    }

    const cameraTarget = new THREE.Vector3(
      group.current.position.x + 4.8,
      5.6,
      group.current.position.z + 6.4,
    )
    camera.position.lerp(cameraTarget, 1 - Math.exp(-delta * 4.2))
    camera.lookAt(
      group.current.position.x,
      0.35,
      group.current.position.z,
    )
  })

  return (
    <group ref={group} position={[initial[0], 0.02, initial[1]]}>
      <ChibiExplorer moving={moving} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[0.42, 0.5, 32]} />
        <meshBasicMaterial color="#b9ef7b" transparent opacity={0.42} />
      </mesh>
    </group>
  )
}
