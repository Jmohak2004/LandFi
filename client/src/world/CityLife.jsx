import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { VICE } from './vicePalette';

function ViceCar({ start, end, speed, color, bodyStyle = 'sedan' }) {
  const ref = useRef();
  const dir = useMemo(
    () => new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize(),
    [start, end]
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.userData.t = ((ref.current.userData.t || 0) + delta * speed) % 1;
    const t = ref.current.userData.t;
    ref.current.position.lerpVectors(
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
      t
    );
    ref.current.position.y = 0.35;
    ref.current.lookAt(
      ref.current.position.x + dir.x,
      ref.current.position.y,
      ref.current.position.z + dir.z
    );
  });

  const [bw, bh, bl] = bodyStyle === 'sport' ? [1.6, 0.45, 3.8] : [2, 0.7, 4.2];

  return (
    <group ref={ref} position={start}>
      <mesh castShadow>
        <boxGeometry args={[bw, bh, bl]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, bh * 0.7, bl * 0.1]}>
        <boxGeometry args={[bw * 0.85, bh * 0.55, bl * 0.45]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.75} metalness={0.9} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0, bh * 0.35, bl / 2 + 0.05]}>
        <boxGeometry args={[bw * 0.7, 0.12, 0.1]} />
        <meshStandardMaterial color="#fffacd" emissive="#ffff99" emissiveIntensity={2} />
      </mesh>
      {/* Tail lights */}
      <mesh position={[0, bh * 0.35, -bl / 2 - 0.05]}>
        <boxGeometry args={[bw * 0.6, 0.1, 0.08]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-bw / 2 - 0.05, bh * 0.25, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[bw / 2 + 0.05, bh * 0.25, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function Pedestrian({ path, speed, color, shirt }) {
  const ref = useRef();
  const curve = useMemo(() => {
    const pts = path.map(p => new THREE.Vector3(p[0], 0, p[2]));
    return new THREE.CatmullRomCurve3(pts, true);
  }, [path]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.userData.t = ((ref.current.userData.t || 0) + delta * speed) % 1;
    const pt = curve.getPoint(ref.current.userData.t);
    const tangent = curve.getTangent(ref.current.userData.t);
    ref.current.position.set(pt.x, 0, pt.z);
    ref.current.lookAt(pt.x + tangent.x, 0, pt.z + tangent.z);
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.28]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Helicopter() {
  const ref = useRef();
  const rotorRef = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.15;
    ref.current.position.set(
      Math.sin(t) * 55,
      22 + Math.sin(t * 2) * 2,
      Math.cos(t) * 55
    );
    ref.current.rotation.y = t + Math.PI / 2;
    if (rotorRef.current) rotorRef.current.rotation.y += delta * 25;
  });

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[1.2, 1, 3]} />
        <meshStandardMaterial color="#2d3748" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 1.8]}>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <meshStandardMaterial color="#4a5568" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.2, 0]} ref={rotorRef}>
        <boxGeometry args={[8, 0.08, 0.4]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 0.08, 0.4]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      <pointLight intensity={0.5} color="#ff0000" distance={5} position={[-0.5, 0, -1.5]} />
    </group>
  );
}

function Billboard({ position, text, color, rotY = 0 }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[0.3, 8, 0.3]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 7, 0]}>
        <boxGeometry args={[10, 4, 0.3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 7, 0.2]}>
        <planeGeometry args={[9, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 7, 0.35]} fontSize={0.5} color="#fff" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </group>
  );
}

export function CityLife() {
  return (
    <group>
      {/* Traffic on boulevards */}
      <ViceCar start={[-58, 0, -24]} end={[58, 0, -24]} speed={0.12} color="#ff1493" bodyStyle="sport" />
      <ViceCar start={[58, 0, 24]} end={[-58, 0, 24]} speed={0.1} color="#00ced1" />
      <ViceCar start={[-58, 0, 0]} end={[58, 0, 0]} speed={0.14} color="#ffd700" bodyStyle="sport" />
      <ViceCar start={[24, 0, -58]} end={[24, 0, 58]} speed={0.09} color="#ff6347" />
      <ViceCar start={[-24, 0, 58]} end={[-24, 0, -58]} speed={0.11} color="#9370db" />
      <ViceCar start={[0, 0, -48]} end={[0, 0, 48]} speed={0.08} color="#32cd32" bodyStyle="sedan" />

      {/* Pedestrians on sidewalks */}
      <Pedestrian
        path={[[-52, 0, 56], [52, 0, 56], [52, 0, 52], [-52, 0, 52]]}
        speed={0.03}
        color="#f5cba7"
        shirt="#e74c3c"
      />
      <Pedestrian
        path={[[52, 0, -56], [-52, 0, -56], [-52, 0, -52], [52, 0, -52]]}
        speed={0.025}
        color="#d4a574"
        shirt="#3498db"
      />
      <Pedestrian
        path={[[-56, 0, -30], [-56, 0, 30], [-52, 0, 30], [-52, 0, -30]]}
        speed={0.035}
        color="#c9a87c"
        shirt="#9b59b6"
      />
      <Pedestrian
        path={[[56, 0, 20], [56, 0, -40], [52, 0, -40], [52, 0, 20]]}
        speed={0.028}
        color="#e8beac"
        shirt="#f39c12"
      />
      <Pedestrian
        path={[[-30, 0, 56], [10, 0, 56], [10, 0, 54], [-30, 0, 54]]}
        speed={0.04}
        color="#f0d9b5"
        shirt="#1abc9c"
      />

      <Helicopter />

      <Billboard position={[-58, 0, 0]} text="VICE CITY" color={VICE.neonPink} rotY={Math.PI / 2} />
      <Billboard position={[58, 0, -20]} text="OCEAN DRIVE" color={VICE.neonCyan} rotY={-Math.PI / 2} />
      <Billboard position={[30, 0, -58]} text="METAVERSE" color={VICE.neonOrange} rotY={0} />
      <Billboard position={[-35, 0, 58]} text="LANDI 1986" color="#ff6b9d" rotY={Math.PI} />
    </group>
  );
}
