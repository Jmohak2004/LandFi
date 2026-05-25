import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingMesh } from './BuildingMesh';
import { ZONE_COLORS, RARITY_COLORS } from './colors';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function ParcelPlot({ parcel, isSelected, isNearby }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const selectParcel = useMetaverseStore(s => s.selectParcel);
  const userId = useMetaverseStore(s => s.userId);

  const [x, , z] = parcel.position;
  const zoneColor = ZONE_COLORS[parcel.zone] || '#00f0ff';
  const rarityColor = RARITY_COLORS[parcel.rarity] || '#94a3b8';
  const owned = parcel.owner === userId;
  const forSale = !parcel.owner || parcel.listed;

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = (isSelected || isNearby || hovered) ? 0.15 + Math.sin(state.clock.elapsedTime * 4) * 0.08 : 0;
    meshRef.current.scale.setScalar(1 + pulse);
  });

  const borderColor = isSelected ? '#ffffff' : isNearby ? '#00ff88' : hovered ? zoneColor : rarityColor;

  return (
    <group position={[x, 0, z]}>
      {/* Sidewalk curb */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 11]} />
        <meshStandardMaterial color="#c4b5a0" roughness={0.9} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          selectParcel(parcel);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color={owned ? '#0f766e' : forSale ? '#1e1b4b' : '#312e81'}
          emissive={borderColor}
          emissiveIntensity={isSelected ? 0.6 : isNearby ? 0.4 : hovered ? 0.25 : 0.1}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments position={[0, 0.06, 0]}>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(10, 0.1, 10)]} />
        <lineBasicMaterial attach="material" color={borderColor} />
      </lineSegments>

      <BuildingMesh building={parcel.building} emissive={zoneColor} />

      {(isSelected || isNearby) && (
        <Text
          position={[0, BUILDING_HEIGHT(parcel.building) + 1.5, 0]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {parcel.name}
        </Text>
      )}

      {parcel.listed && (
        <Html position={[0, 3, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="parcel-tag for-sale">FOR SALE · {parcel.listPrice} META</div>
        </Html>
      )}

      {owned && (
        <mesh position={[0, 0.2, 4.8]}>
          <boxGeometry args={[0.3, 0.6, 0.1]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
}

function BUILDING_HEIGHT(b) {
  const h = { none: 0.3, gallery: 2.5, club: 4, shop: 2, office: 6, arena: 5 };
  return h[b] || 1;
}
