import { useMemo } from 'react';
import * as THREE from 'three';
import { VICE } from './vicePalette';

function StreetLamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 4, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.8} />
      </mesh>
      <mesh position={[0.3, 4, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#fffacd" emissive="#ffd700" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0.3, 4, 0]} intensity={0.8} color="#ffd700" distance={12} />
    </group>
  );
}

function RoadSegment({ position, size, rotY = 0 }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color={VICE.asphalt} roughness={0.9} />
      </mesh>
      {/* Yellow center dashes */}
      {size[0] > size[1] && (
        <group>
          {Array.from({ length: Math.floor(size[0] / 4) }, (_, i) => (
            <mesh
              key={i}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[(i - Math.floor(size[0] / 8)) * 4, 0.04, 0]}
            >
              <planeGeometry args={[2, 0.15]} />
              <meshStandardMaterial color={VICE.roadLine} emissive={VICE.roadLine} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function Sidewalk({ position, size }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={VICE.sidewalk} roughness={0.95} />
    </mesh>
  );
}

export function ViceCityStreets() {
  const lamps = useMemo(() => {
    const positions = [];
    for (let i = -54; i <= 54; i += 18) {
      positions.push([i, 0, 58], [i, 0, -58], [58, 0, i], [-58, 0, i]);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Main ground — grass/concrete mix */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#3d4f3d" roughness={0.95} />
      </mesh>

      {/* District concrete pad under parcels */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.85} />
      </mesh>

      {/* Boulevards */}
      {[-48, -24, 0, 24, 48].map(z => (
        <RoadSegment key={`h-${z}`} position={[0, 0, z]} size={[120, 6]} />
      ))}
      {[-48, -24, 0, 24, 48].map(x => (
        <RoadSegment key={`v-${x}`} position={[x, 0, 0]} size={[6, 120]} rotY={0} />
      ))}

      {/* Sidewalks along district */}
      <Sidewalk position={[0, 0.02, 54]} size={[104, 3]} />
      <Sidewalk position={[0, 0.02, -54]} size={[104, 3]} />
      <Sidewalk position={[54, 0.02, 0]} size={[3, 104]} />
      <Sidewalk position={[-54, 0.02, 0]} size={[3, 104]} />

      {/* Crosswalk stripes at center */}
      {[-2, 0, 2].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, 0]}>
          <planeGeometry args={[1.5, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}

      {lamps.map((pos, i) => (
        <StreetLamp key={i} position={pos} />
      ))}
    </group>
  );
}
