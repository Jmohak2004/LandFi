import { useMetaverseStore } from '../store/useMetaverseStore';
import { ZONE_COLORS } from '../world/colors';

export function Minimap() {
  const show = useMetaverseStore(s => s.showMinimap);
  const parcels = useMetaverseStore(s => s.parcels);
  const playerPosition = useMetaverseStore(s => s.playerPosition);
  const selectedParcel = useMetaverseStore(s => s.selectedParcel);
  const userId = useMetaverseStore(s => s.userId);

  if (!show) return null;

  const scale = 1.2;
  const offset = 50;

  return (
    <div className="minimap">
      <div className="minimap-header">SECTOR MAP</div>
      <svg viewBox="-60 -60 120 120" className="minimap-svg">
        <rect x="-55" y="-55" width="110" height="110" fill="#0a0a14" stroke="#00f0ff33" strokeWidth="0.5" rx="2" />
        {parcels.map(p => {
          const cx = p.position[0] * scale;
          const cy = p.position[2] * scale;
          const owned = p.owner === userId;
          const selected = selectedParcel?.id === p.id;
          return (
            <rect
              key={p.id}
              x={cx - 2}
              y={cy - 2}
              width={4}
              height={4}
              fill={selected ? '#fff' : owned ? '#00ff88' : ZONE_COLORS[p.zone] || '#64748b'}
              opacity={selected ? 1 : 0.7}
              rx={0.5}
            />
          );
        })}
        <circle
          cx={playerPosition[0] * scale}
          cy={playerPosition[2] * scale}
          r={2.5}
          fill="#00ffff"
          stroke="#fff"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
