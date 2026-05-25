import { BUILDING_COLORS, BUILDING_HEIGHTS } from './colors';

export function BuildingMesh({ building, color, emissive }) {
  const h = BUILDING_HEIGHTS[building] || 0.3;
  const c = color || BUILDING_COLORS[building] || '#334155';

  if (building === 'none') {
    return (
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3.5, 0.3, 3.5]} />
        <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.2} />
      </mesh>
    );
  }

  if (building === 'arena') {
    return (
      <group>
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[2.2, 2.5, h, 8]} />
          <meshStandardMaterial color={c} emissive={emissive || c} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, h + 0.3, 0]} rotation={[0, 0, 0]}>
          <ringGeometry args={[2, 2.8, 16]} />
          <meshStandardMaterial color="#fff" emissive="#ff0066" emissiveIntensity={1} side={2} />
        </mesh>
      </group>
    );
  }

  if (building === 'club') {
    return (
      <group>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[3, h, 3]} />
          <meshStandardMaterial color={c} emissive={emissive || c} emissiveIntensity={0.5} metalness={0.5} />
        </mesh>
        {[-1.2, 1.2].map((x, i) => (
          <mesh key={i} position={[x, h + 0.5, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#ff00ff" emissiveIntensity={2} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[3, h, 3]} />
        <meshStandardMaterial color={c} emissive={emissive || c} emissiveIntensity={0.35} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, h, 1.51]}>
        <planeGeometry args={[2, 1.2]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#00ffff" emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
