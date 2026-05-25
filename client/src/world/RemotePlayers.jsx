import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar';
import { useMetaverseStore } from '../store/useMetaverseStore';

function RemotePlayer({ player }) {
  const groupRef = useRef();
  const targetPos = useRef(new THREE.Vector3(...(player.position || [0, 0, 0])));

  useFrame(() => {
    if (!groupRef.current) return;
    targetPos.current.set(player.position[0], player.position[1], player.position[2]);
    groupRef.current.position.lerp(targetPos.current, 0.18);
    if (player.rotation != null) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        player.rotation,
        0.18
      );
    }
  });

  return (
    <group ref={groupRef} position={player.position}>
      <PlayerAvatar color={player.color} name={player.name} showLabel />
    </group>
  );
}

export function RemotePlayers() {
  const remotePlayers = useMetaverseStore(s => s.remotePlayers);
  return (
    <>
      {remotePlayers.map(p => (
        <RemotePlayer key={p.id} player={p} />
      ))}
    </>
  );
}
