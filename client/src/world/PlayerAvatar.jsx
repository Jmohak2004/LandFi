import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function PlayerAvatar({ color = '#00f0ff', name, isLocal = false, showLabel = true }) {
  const skin = '#e8b89d';
  const pants = isLocal ? '#1e3a5f' : '#2d3748';

  return (
    <group>
      {/* Legs */}
      <mesh position={[-0.12, 0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.5, 0.22]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <mesh position={[0.12, 0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.5, 0.22]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      {/* Torso — Hawaiian shirt vibe */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.55, 0.65, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.38, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.38, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Sunglasses */}
      <mesh position={[0, 1.58, 0.2]}>
        <boxGeometry args={[0.35, 0.08, 0.05]} />
        <meshStandardMaterial color="#111" metalness={0.9} />
      </mesh>
      {/* Shadow ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.65, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isLocal ? 0.8 : 0.4}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {showLabel && name && (
        <Html position={[0, 2.1, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className={`avatar-label ${isLocal ? 'local' : ''}`}>{name}</div>
        </Html>
      )}
    </group>
  );
}
