import { Users, Wifi, WifiOff } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function OnlinePlayers() {
  const onlineCount = useMetaverseStore(s => s.onlineCount);
  const multiplayerConnected = useMetaverseStore(s => s.multiplayerConnected);
  const remotePlayers = useMetaverseStore(s => s.remotePlayers);

  return (
    <div className="online-panel">
      <div className="online-header">
        {multiplayerConnected ? <Wifi size={14} className="online-icon" /> : <WifiOff size={14} className="offline-icon" />}
        <Users size={14} />
        <span>{onlineCount} Online</span>
      </div>
      {remotePlayers.length > 0 && (
        <ul className="online-list">
          {remotePlayers.map(p => (
            <li key={p.id}>
              <span className="online-dot" style={{ background: p.color }} />
              {p.name}
              {p.walletAddress && <span className="wallet-badge">⛓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
