const forestProps = [
  [-5.1, -3.6], [-3.8, -1.1], [-4.5, 3.8], [-0.7, 3.9],
  [2.6, 3.7], [5.2, 3.4], [5.2, -3.6], [1.8, -4.1],
]

const mineProps = [
  [-5, -4], [-3.7, 2.9], [-1.2, -3.7], [1.8, 3.8],
  [3.7, 3], [5, -3.6], [4.8, 0.8], [0.2, -4.2],
]

const ruinProps = [
  [-5, -3.8], [-4.7, 3.6], [-2.2, 3.9], [0.2, -3.9],
  [2.5, 3.8], [4.9, 3.3], [5.1, -3.5], [2.8, -3.4],
]

function Tree({ position }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 1.3, 8]} />
        <meshStandardMaterial color="#5a432d" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]}>
        <coneGeometry args={[0.65, 1.4, 9]} />
        <meshStandardMaterial color="#315f3b" roughness={0.9} />
      </mesh>
    </group>
  )
}

function MineProp({ position, index }) {
  const crystal = index % 3 === 0
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh
        castShadow
        position={[0, crystal ? 0.42 : 0.28, 0]}
        rotation={[0.1, index * 0.7, crystal ? -0.18 : 0]}
      >
        {crystal ? (
          <octahedronGeometry args={[0.42, 0]} />
        ) : (
          <dodecahedronGeometry args={[0.42, 0]} />
        )}
        <meshStandardMaterial
          color={crystal ? '#558ea4' : '#44484a'}
          emissive={crystal ? '#174b60' : '#000000'}
          emissiveIntensity={crystal ? 0.7 : 0}
          roughness={0.82}
        />
      </mesh>
    </group>
  )
}

function RuinProp({ position, index }) {
  const broken = index % 2 === 0
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh
        castShadow
        position={[0, broken ? 0.55 : 0.85, 0]}
        rotation={[0, index * 0.45, broken ? 0.14 : 0]}
      >
        <boxGeometry args={[0.42, broken ? 1.1 : 1.7, 0.42]} />
        <meshStandardMaterial color="#755257" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]} rotation={[0, index, 0]}>
        <boxGeometry args={[0.85, 0.18, 0.7]} />
        <meshStandardMaterial color="#533b3f" roughness={1} />
      </mesh>
    </group>
  )
}

export default function ZoneMap({ config }) {
  const props =
    config.theme === 'forest'
      ? forestProps
      : config.theme === 'mine'
        ? mineProps
        : ruinProps

  return (
    <>
      <color attach="background" args={[config.fog]} />
      <fog attach="fog" args={[config.fog, 8, 17]} />
      <ambientLight intensity={1.2} color={config.light} />
      <directionalLight
        castShadow
        color={config.light}
        intensity={2.4}
        position={[-4, 8, 5]}
        shadow-mapSize={[1024, 1024]}
      />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color={config.floor} roughness={1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[11, 2.25]} />
        <meshStandardMaterial color={config.path} roughness={0.95} />
      </mesh>

      {props.map((position, index) =>
        config.theme === 'forest' ? (
          <Tree key={`${position}`} position={position} />
        ) : config.theme === 'mine' ? (
          <MineProp key={`${position}`} position={position} index={index} />
        ) : (
          <RuinProp key={`${position}`} position={position} index={index} />
        ),
      )}
    </>
  )
}
