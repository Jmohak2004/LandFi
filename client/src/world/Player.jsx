import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { useMultiplayer } from '../hooks/useMultiplayer';

const MOVE_SPEED = 8;
const RUN_MULT = 1.8;
const WORLD_BOUNDS = 52;

const keys = { w: false, a: false, s: false, d: false, shift: false };

export function Player() {
  const groupRef = useRef();
  const { camera } = useThree();
  const setPlayerPosition = useMetaverseStore(s => s.setPlayerPosition);
  const setNearbyParcel = useMetaverseStore(s => s.setNearbyParcel);
  const parcels = useMetaverseStore(s => s.parcels);
  const nearbyParcel = useMetaverseStore(s => s.nearbyParcel);
  const displayName = useMetaverseStore(s => s.displayName);
  const avatarColor = useMetaverseStore(s => s.avatarColor);
  const vrActive = useMetaverseStore(s => s.vrActive);

  const { sendPosition } = useMultiplayer();

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys) keys[k === 'shift' ? 'shift' : k] = true;
      if (k === 'e' && nearbyParcel) {
        useMetaverseStore.getState().selectParcel(nearbyParcel);
      }
      if (k === 'r') useMetaverseStore.getState().toggleRadio();
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys) keys[k === 'shift' ? 'shift' : k] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [nearbyParcel]);

  const cameraOffset = useRef(new THREE.Vector3(0, 5.5, 14));

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const speed = (keys.shift ? RUN_MULT : 1) * MOVE_SPEED * delta;
    const dir = new THREE.Vector3();

    if (keys.w) dir.z -= 1;
    if (keys.s) dir.z += 1;
    if (keys.a) dir.x -= 1;
    if (keys.d) dir.x += 1;

    if (dir.length() > 0) {
      dir.normalize().multiplyScalar(speed);
      groupRef.current.position.add(dir);
      const angle = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        0.15
      );
    }

    groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -WORLD_BOUNDS, WORLD_BOUNDS);
    groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -WORLD_BOUNDS, WORLD_BOUNDS);
    groupRef.current.position.y = 0;

    const pos = groupRef.current.position;
    setPlayerPosition([pos.x, pos.y, pos.z]);
    sendPosition(pos.x, pos.y, pos.z, groupRef.current.rotation.y);

    let nearest = null;
    let nearestDist = 8;
    parcels.forEach(p => {
      const dx = pos.x - p.position[0];
      const dz = pos.z - p.position[2];
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = p;
      }
    });
    if (nearest?.id !== nearbyParcel?.id) setNearbyParcel(nearest);

    if (!vrActive) {
      const targetCam = new THREE.Vector3(
        pos.x + cameraOffset.current.x,
        pos.y + cameraOffset.current.y,
        pos.z + cameraOffset.current.z
      );
      camera.position.lerp(targetCam, 0.08);
      camera.lookAt(pos.x, pos.y + 1.5, pos.z);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 15]}>
      <PlayerAvatar color={avatarColor} name={displayName} isLocal showLabel />
    </group>
  );
}
