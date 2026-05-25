import { useMemo } from 'react';
import * as THREE from 'three';
import { VICE } from './vicePalette';

function WindowGrid({ w, h, d, floors = 6 }) {
  const windows = useMemo(() => {
    const nodes = [];
    for (let f = 1; f < floors; f++) {
      for (let col = -1; col <= 1; col += 2) {
        nodes.push(
          <mesh key={`${f}-${col}`} position={[col * (w * 0.25), f * (h / floors), d / 2 + 0.02]}>
            <planeGeometry args={[w * 0.15, h / floors * 0.5]} />
            <meshStandardMaterial
              color="#fff8e7"
              emissive={f % 2 === 0 ? '#ffd700' : '#87ceeb'}
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      }
    }
    return nodes;
  }, [w, h, d, floors]);
  return <group>{windows}</group>;
}

function Skyscraper({ position, width, height, depth, color, rotY = 0 }) {
  const floors = Math.max(4, Math.floor(height / 3));
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <WindowGrid w={width} h={height} d={depth} floors={floors} />
      {/* Art deco crown */}
      <mesh position={[0, height + 0.8, 0]}>
        <boxGeometry args={[width * 0.7, 1.2, depth * 0.7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, height + 1.8, 0]}>
        <boxGeometry args={[width * 0.4, 0.8, depth * 0.4]} />
        <meshStandardMaterial color="#fff" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function HotelTower({ position }) {
  return (
    <group position={position}>
      <Skyscraper position={[0, 0, 0]} width={8} height={28} depth={8} color="#ff6b9d" />
      <mesh position={[0, 30, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
        <meshStandardMaterial color="#ff1493" emissive="#ff1493" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 33, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function CitySkyline() {
  const buildings = useMemo(() => {
    const list = [];
    const colors = VICE.buildingPastels;
    let ci = 0;

    // Ring of skyscrapers around playable district
    for (let i = -70; i <= 70; i += 14) {
      list.push({
        pos: [i, 0, -72],
        w: 6 + Math.random() * 4,
        h: 15 + Math.random() * 20,
        d: 6 + Math.random() * 3,
        color: colors[ci++ % colors.length],
        rot: 0,
      });
      list.push({
        pos: [i, 0, 72],
        w: 5 + Math.random() * 5,
        h: 12 + Math.random() * 18,
        d: 5 + Math.random() * 4,
        color: colors[ci++ % colors.length],
        rot: Math.PI,
      });
      list.push({
        pos: [-72, 0, i],
        w: 5 + Math.random() * 4,
        h: 18 + Math.random() * 15,
        d: 6 + Math.random() * 3,
        color: colors[ci++ % colors.length],
        rot: Math.PI / 2,
      });
      list.push({
        pos: [72, 0, i],
        w: 6 + Math.random() * 3,
        h: 14 + Math.random() * 22,
        d: 5 + Math.random() * 4,
        color: colors[ci++ % colors.length],
        rot: -Math.PI / 2,
      });
    }

    // Corner landmarks
    list.push({ pos: [-65, 0, -65], w: 12, h: 35, d: 10, color: '#ff6b9d', rot: 0.4, landmark: true });
    list.push({ pos: [65, 0, -65], w: 10, h: 30, d: 12, color: '#7dd3fc', rot: -0.3, landmark: true });
    list.push({ pos: [-65, 0, 65], w: 11, h: 28, d: 9, color: '#fcd34d', rot: 0.2, landmark: true });
    list.push({ pos: [65, 0, 65], w: 9, h: 32, d: 11, color: '#a78bfa', rot: -0.5, landmark: true });

    return list;
  }, []);

  return (
    <group>
      {buildings.map((b, i) =>
        b.landmark ? (
          <HotelTower key={i} position={b.pos} />
        ) : (
          <Skyscraper
            key={i}
            position={b.pos}
            width={b.w}
            height={b.h}
            depth={b.d}
            color={b.color}
            rotY={b.rot}
          />
        )
      )}
      {/* LANDI mega sign */}
      <group position={[0, 0, -68]}>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[24, 3, 1]} />
          <meshStandardMaterial color="#111" emissive="#ff1493" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 12, 0.6]}>
          <planeGeometry args={[22, 2]} />
          <meshStandardMaterial color="#ff1493" emissive="#ff1493" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[20, 8, 2]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
      </group>
    </group>
  );
}
