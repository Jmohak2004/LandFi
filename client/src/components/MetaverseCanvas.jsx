import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, VRButton } from '@react-three/xr';
import { CityWorld } from '../world/CityWorld';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { xrStore } from '../lib/xrStore';

function Scene() {
  return (
    <Suspense fallback={null}>
      <CityWorld />
    </Suspense>
  );
}

export function MetaverseCanvas() {
  const setVrActive = useMetaverseStore(s => s.setVrActive);
  const addNotification = useMetaverseStore(s => s.addNotification);

  useEffect(() => {
    return xrStore.subscribe((state, prev) => {
      if (state.session !== prev.session) {
        setVrActive(state.session != null);
        if (state.session) addNotification('VR session started — look around!', 'success');
      }
    });
  }, [setVrActive, addNotification]);

  return (
    <div className="metaverse-canvas">
      <div className="vr-button-wrap">
        <VRButton
          store={xrStore}
          onError={() => addNotification('VR not supported — try Meta Quest browser or Chrome', 'warn')}
        >
          {(status) => (status === 'unsupported' ? 'VR Unavailable' : status === 'entered' ? 'Exit VR' : 'Enter VR')}
        </VRButton>
      </div>
      <Canvas
        shadows
        camera={{ position: [0, 8, 22], fov: 62, near: 0.1, far: 250 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <Scene />
        </XR>
      </Canvas>
      <div className="canvas-vignette" />
      <div className="canvas-scanlines" />
    </div>
  );
}
