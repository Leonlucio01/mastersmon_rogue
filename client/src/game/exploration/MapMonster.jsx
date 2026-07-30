import { Float, Html } from '@react-three/drei'

export default function MapMonster({
  monster,
  accent,
  nearby,
  active,
  defeated,
}) {
  if (defeated) return null

  return (
    <Float speed={active ? 2.3 : 1.2} floatIntensity={0.18} rotationIntensity={0.08}>
      <group position={[monster.position[0], 0.18, monster.position[1]]}>
        <mesh castShadow position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.48, 20, 16]} />
          <meshStandardMaterial
            color={active ? accent : '#59635f'}
            emissive={nearby && active ? accent : '#000000'}
            emissiveIntensity={nearby && active ? 0.75 : 0}
            roughness={0.68}
          />
        </mesh>
        <mesh position={[-0.14, 0.52, 0.42]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#101716" />
        </mesh>
        <mesh position={[0.14, 0.52, 0.42]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#101716" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <ringGeometry args={[0.56, 0.66, 32]} />
          <meshBasicMaterial
            color={active ? accent : '#59635f'}
            transparent
            opacity={nearby ? 0.9 : 0.25}
          />
        </mesh>

        {nearby && (
          <Html center position={[0, 1.25, 0]} distanceFactor={9}>
            <div className={`map-monster-label ${active ? 'active' : 'locked'}`}>
              <strong>{monster.name}</strong>
              <small>{active ? 'Objetivo actual' : 'Encuentro posterior'}</small>
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}
