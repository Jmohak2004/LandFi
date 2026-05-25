import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { VICE } from './vicePalette';

function AnimatedOcean() {
  const ref = useRef();
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: VICE.ocean,
        emissive: VICE.oceanDeep,
        emissiveIntensity: 0.35,
        metalness: 0.95,
        roughness: 0.05,
        transparent: true,
        opacity: 0.92,
      }),
    []
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = -0.15 + Math.sin(t * 0.8) * 0.12;
    mat.emissiveIntensity = 0.3 + Math.sin(t * 1.2) * 0.1;
  });

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.15, 62]}
      material={mat}
    >
      <planeGeometry args={[200, 40, 32, 8]} />
    </mesh>
  );
}

function PalmTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 4, 8]} />
        <meshStandardMaterial color={VICE.palmTrunk} />
      </mesh>
      {[0, 1.4, 2.8, 4.2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 1.2, 4.5, Math.cos(angle) * 1.2]}
          rotation={[0.5, angle, 0]}
          castShadow
        >
          <coneGeometry args={[1.2, 3.5, 6]} />
          <meshStandardMaterial color={VICE.palmLeaf} />
        </mesh>
      ))}
    </group>
  );
}

function Pier({ position }) {
  return (
    <group position={position}>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[(i - 6) * 2, 0.6, 0]}>
          <boxGeometry args={[1.8, 0.3, 4]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      ))}
      <mesh position={[0, 1.2, -2]}>
        <boxGeometry args={[26, 0.4, 1]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
    </group>
  );
}

function Speedboat({ path, speed, color }) {
  const ref = useRef();
  const curve = useMemo(() => {
    const pts = path.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(pts, true);
  }, [path]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.userData.t = ((ref.current.userData.t || 0) + delta * speed) % 1;
    const pt = curve.getPoint(ref.current.userData.t);
    const tangent = curve.getTangent(ref.current.userData.t);
    ref.current.position.copy(pt);
    ref.current.lookAt(pt.clone().add(tangent));
    ref.current.position.y = 0.3 + Math.sin(ref.current.userData.t * 20) * 0.08;
  });

  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.5, 3.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.8, -0.5]}>
        <boxGeometry args={[1, 0.8, 1.5]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function BeachAndOcean() {
  return (
    <group>
      <AnimatedOcean />
      {/* Second ocean layer for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 68]}>
        <planeGeometry args={[220, 50]} />
        <meshStandardMaterial color={VICE.oceanDeep} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Sandy beach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 48]} receiveShadow>
        <planeGeometry args={[200, 22]} />
        <meshStandardMaterial color={VICE.sand} roughness={1} />
      </mesh>

      {/* Boardwalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 42]}>
        <planeGeometry args={[200, 4]} />
        <meshStandardMaterial color="#c4a574" roughness={0.8} />
      </mesh>

      <Pier position={[0, 0, 58]} />

      {/* Beach palms */}
      {[-40, -20, 0, 20, 40, 60].map((x, i) => (
        <PalmTree key={i} position={[x, 0, 46 + (i % 3) * 2]} scale={0.9 + (i % 3) * 0.15} />
      ))}

      <Speedboat
        path={[[-30, 0, 68], [30, 0, 72], [50, 0, 65], [20, 0, 60], [-30, 0, 68]]}
        speed={0.04}
        color="#ff1493"
      />
      <Speedboat
        path={[[40, 0, 70], [-10, 0, 75], [-40, 0, 68], [40, 0, 70]]}
        speed={0.06}
        color="#00ced1"
      />

      {/* Beach umbrellas */}
      {[[-25, 0, 44], [15, 0, 45], [35, 0, 43]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0, 2.2, 0]} rotation={[0.1, 0, 0]}>
            <coneGeometry args={[1.8, 0.8, 8]} />
            <meshStandardMaterial color={['#ff6b9d', '#fcd34d', '#7dd3fc'][i]} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      <Float speed={2} floatIntensity={0.3}>
        <mesh position={[80, 8, 75]}>
          <boxGeometry args={[12, 0.1, 4]} />
          <meshStandardMaterial color="#fff" transparent opacity={0.4} />
        </mesh>
      </Float>
    </group>
  );
}
