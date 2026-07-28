import { ContactShadows, Float } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

function Character() {
  return (
    <group position={[-1.7, 0.15, 0]}>
      <mesh castShadow position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.36, 0.8, 8, 18]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color="#f5cfa9" roughness={0.65} />
      </mesh>
      <mesh castShadow position={[-0.14, 1.72, 0.27]} scale={[0.05, 0.05, 0.04]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#082f49" />
      </mesh>
      <mesh castShadow position={[0.14, 1.72, 0.27]} scale={[0.05, 0.05, 0.04]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#082f49" />
      </mesh>
    </group>
  )
}

function Enemy({ defeated }) {
  return (
    <Float
      speed={defeated ? 0 : 2}
      rotationIntensity={defeated ? 0 : 0.12}
      floatIntensity={defeated ? 0 : 0.25}
    >
      <group position={[1.65, defeated ? -0.25 : 0.2, 0]} scale={defeated ? [1.15, 0.25, 1.15] : 1}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.72, 32, 24]} />
          <meshStandardMaterial
            color={defeated ? '#516057' : '#a3e635'}
            roughness={0.7}
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

function World({ enemyDefeated }) {
  return (
    <>
      <color attach="background" args={['#101e22']} />
      <fog attach="fog" args={['#101e22', 7, 13]} />
      <ambientLight intensity={1.4} />
      <directionalLight
        castShadow
        intensity={2.4}
        position={[-3, 7, 5]}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#bceaff', '#19382b', 0.8]} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color="#294a3a" roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
        <planeGeometry args={[5.8, 2.8]} />
        <meshStandardMaterial color="#49644a" roughness={1} />
      </mesh>

      <Character />
      <Enemy defeated={enemyDefeated} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={9}
        blur={2.6}
        far={4}
      />
    </>
  )
}

export default function GameScene({ enemyDefeated }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      orthographic
      camera={{ position: [5.5, 4.5, 7], zoom: 72, near: 0.1, far: 100 }}
      aria-label="Escena de combate entre Kael y un Slime musgoso"
    >
      <Suspense fallback={null}>
        <World enemyDefeated={enemyDefeated} />
      </Suspense>
    </Canvas>
  )
}
