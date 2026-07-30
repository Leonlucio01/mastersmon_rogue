import { Float, Html } from '@react-three/drei'

function Chest() {
  return (
    <group>
      <mesh castShadow position={[0, 0.26, 0]}>
        <boxGeometry args={[0.62, 0.4, 0.46]} />
        <meshStandardMaterial color="#76512f" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 0.5, -0.04]}>
        <boxGeometry args={[0.64, 0.18, 0.48]} />
        <meshStandardMaterial color="#9a6938" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.34, 0.245]}>
        <boxGeometry args={[0.12, 0.18, 0.035]} />
        <meshStandardMaterial
          color="#e4b955"
          emissive="#6e4c0b"
          emissiveIntensity={0.7}
          metalness={0.55}
        />
      </mesh>
    </group>
  )
}

function Crystal({ accent }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.42, 0]} rotation={[0.08, 0.2, -0.12]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.65}
          roughness={0.32}
        />
      </mesh>
      <pointLight color={accent} intensity={0.75} distance={2.2} />
    </group>
  )
}

function Herb() {
  return (
    <group position={[0, 0.08, 0]}>
      {[-0.18, 0, 0.18].map((offset, index) => (
        <mesh
          key={offset}
          castShadow
          position={[offset, 0.24 + index * 0.04, 0]}
          rotation={[0, 0, offset * 1.8]}
        >
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial
            color={index === 1 ? '#8fe08a' : '#579b5f'}
            emissive="#214f2c"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function MapCollectible({
  item,
  accent,
  nearby,
  collected,
}) {
  if (collected) return null

  return (
    <Float speed={1.8} floatIntensity={0.12} rotationIntensity={0.04}>
      <group position={[item.position[0], 0.08, item.position[1]]}>
        {item.type === 'chest' ? (
          <Chest />
        ) : item.type === 'herb' ? (
          <Herb />
        ) : (
          <Crystal accent={accent} />
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.46, 0.54, 32]} />
          <meshBasicMaterial
            color={item.type === 'chest' ? '#f2c665' : accent}
            transparent
            opacity={nearby ? 0.9 : 0.3}
          />
        </mesh>

        <Html center position={[0, 1.05, 0]} distanceFactor={9}>
          <div className={`collectible-indicator ${nearby ? 'nearby' : ''}`}>
            <strong>{nearby ? item.name : '!'}</strong>
            {nearby && <small>Interactuar · E</small>}
          </div>
        </Html>
      </group>
    </Float>
  )
}
