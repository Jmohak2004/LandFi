import { Wallet, Map, Store, Calendar, Compass, User, Glasses, Radio, Sun, Moon, LayoutDashboard, Vote, ScrollText } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { WalletButton } from './WalletButton';
import { OnlinePlayers } from './OnlinePlayers';

export function HUD() {
  const balance = useMetaverseStore(s => s.balance);
  const portfolioValue = useMetaverseStore(s => s.portfolioValue);
  const totalEarned = useMetaverseStore(s => s.totalEarned);
  const displayName = useMetaverseStore(s => s.displayName);
  const nearbyParcel = useMetaverseStore(s => s.nearbyParcel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const toggleMinimap = useMetaverseStore(s => s.toggleMinimap);
  const marketStats = useMetaverseStore(s => s.marketStats);
  const reputation = useMetaverseStore(s => s.reputation);
  const vrActive = useMetaverseStore(s => s.vrActive);
  const walletAddress = useMetaverseStore(s => s.walletAddress);
  const timeOfDay = useMetaverseStore(s => s.timeOfDay);
  const radioOn = useMetaverseStore(s => s.radioOn);
  const toggleRadio = useMetaverseStore(s => s.toggleRadio);
  const isNight = timeOfDay < 0.35;

  return (
    <>
      <header className="hud-top">
        <div className="brand">
          <div className="brand-logo">LANDFI</div>
          <span className="brand-tag">VIRTUAL LAND PROTOCOL</span>
          {vrActive && <span className="vr-badge"><Glasses size={12} /> VR</span>}
        </div>

        <div className="hud-stats">
          <div className="hud-stat">
            <Wallet size={16} />
            <div>
              <label>{walletAddress ? 'META + WALLET' : 'BALANCE'}</label>
              <span>{balance.toLocaleString()} META</span>
            </div>
          </div>
          <div className="hud-stat">
            <Compass size={16} />
            <div>
              <label>PORTFOLIO</label>
              <span>{portfolioValue.toLocaleString()} META</span>
            </div>
          </div>
          <div className="hud-stat">
            <User size={16} />
            <div>
              <label>{reputation?.tier?.toUpperCase() || 'CITIZEN'}</label>
              <span>{displayName}</span>
            </div>
          </div>
        </div>

        <div className="hud-actions">
          <WalletButton />
          <button className="hud-btn" onClick={() => setActivePanel('dashboard')} title="Dashboard">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button className="hud-btn" onClick={() => setActivePanel('governance')} title="DAO">
            <Vote size={18} />
            <span>DAO</span>
          </button>
          <button className="hud-btn" onClick={() => setActivePanel('activity')} title="Activity">
            <ScrollText size={18} />
          </button>
          <button className="hud-btn" onClick={() => setActivePanel('market')} title="Marketplace">
            <Store size={18} />
            <span>Market</span>
          </button>
          <button className="hud-btn" onClick={() => setActivePanel('events')} title="Events">
            <Calendar size={18} />
            <span>Events</span>
          </button>
          <button className={`hud-btn ${radioOn ? 'active-radio' : ''}`} onClick={toggleRadio} title="Radio (R)">
            <Radio size={18} />
          </button>
          <button className="hud-btn" onClick={toggleMinimap} title="Minimap">
            <Map size={18} />
          </button>
        </div>
      </header>

      <OnlinePlayers />

      <div className="hud-bottom-left">
        <div className="controls-hint">
          <kbd>W A S D</kbd> Move · <kbd>SHIFT</kbd> Run · <kbd>E</kbd> Interact · <kbd>R</kbd> Radio · <kbd>Click</kbd> Plot
          <span className="time-badge">{isNight ? <><Moon size={12} /> Night cycle</> : <><Sun size={12} /> Day cycle</>}</span>
          {vrActive && <> · <strong>VR controllers</strong> to look around</>}
        </div>
        <div className="controls-hint vr-hint">
          Use the <strong>Enter VR</strong> button (bottom-right of world) with Meta Quest or WebXR headset
        </div>
        {nearbyParcel && (
          <div className="proximity-hint">
            Near: <strong>{nearbyParcel.name}</strong> — Press <kbd>E</kbd>
          </div>
        )}
      </div>

      <div className="hud-bottom-right">
        <div className="market-ticker">
          <span>Vol: {(marketStats.totalVolume || 0).toLocaleString()}</span>
          <span>Deeds: {marketStats.deedsMinted || 0}</span>
          <span>Staked: {(marketStats.totalStaked || 0).toLocaleString()}</span>
          <span>Yield: {totalEarned.toLocaleString()}</span>
        </div>
      </div>
    </>
  );
}
