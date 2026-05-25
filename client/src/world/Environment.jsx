import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import { CitySkyline } from './CitySkyline';
import { ViceCityStreets } from './ViceCityStreets';
import { BeachAndOcean } from './BeachAndOcean';
import { CityLife } from './CityLife';
import { VICE } from './vicePalette';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function Environment() {
  const sunRef = useRef();
  const timeOfDay = useMetaverseStore(s => s.timeOfDay);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.02;
    useMetaverseStore.setState({
      timeOfDay: 0.5 + Math.sin(t) * 0.35,
    });
    if (sunRef.current) {
      const angle = state.clock.elapsedTime * 0.04;
      sunRef.current.position.set(
        Math.cos(angle) * 60,
        25 + Math.sin(angle) * 15,
        Math.sin(angle) * 40
      );
    }
  });

  const isNight = timeOfDay < 0.35;
  const sunPosition = isNight ? [0, -10, 0] : [80, 35, 40];

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.52}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.9}
        rayleigh={0.4}
        turbidity={8}
      />

      <fog attach="fog" args={[VICE.fog, 60, 160]} />

      <hemisphereLight
        args={[VICE.skyHorizon, '#3d5a3d', 0.6]}
      />
      <ambientLight intensity={isNight ? 0.15 : 0.35} color={isNight ? '#4a5568' : '#fff5e6'} />
      <directionalLight
        ref={sunRef}
        position={[80, 35, 40]}
        intensity={isNight ? 0.2 : 1.4}
        color={VICE.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />

      {!isNight && (
        <pointLight position={[-40, 20, -30]} intensity={0.6} color={VICE.neonPink} distance={80} />
      )}
      <pointLight position={[40, 15, 30]} intensity={0.5} color={VICE.neonCyan} distance={70} />

      {isNight && (
        <Stars radius={120} depth={60} count={2000} factor={4} saturation={0.6} fade speed={0.3} />
      )}

      <ViceCityStreets />
      <BeachAndOcean />
      <CitySkyline />
      <CityLife />
    </>
  );
}
