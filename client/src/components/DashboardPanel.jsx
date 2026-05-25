import { X, TrendingUp, Layers, Shield, Coins, BarChart3 } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { ZONE_COLORS } from '../world/colors';
import { getContractReadiness, isContractConfigured } from '../lib/contracts';

const ZONE_LABELS = {
  'neon-district': 'Neon District',
  'cyber-bay': 'Cyber Bay',
  'sky-tower': 'Sky Tower',
  'meta-mall': 'Meta Mall',
  'arcade-block': 'Arcade Block',
};

export function DashboardPanel() {
  const activePanel = useMetaverseStore(s => s.activePanel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const analytics = useMetaverseStore(s => s.analytics);
  const zoneMetrics = useMetaverseStore(s => s.zoneMetrics);
  const marketStats = useMetaverseStore(s => s.marketStats);
  const reputation = useMetaverseStore(s => s.reputation);
  const governancePower = useMetaverseStore(s => s.governancePower);
  const portfolioValue = useMetaverseStore(s => s.portfolioValue);
  const totalStaked = useMetaverseStore(s => s.totalStaked);
  const totalEarned = useMetaverseStore(s => s.totalEarned);
  const ownedParcels = useMetaverseStore(s => s.ownedParcels);
  const walletAddress = useMetaverseStore(s => s.walletAddress);
  const chainId = useMetaverseStore(s => s.chainId);

  if (activePanel !== 'dashboard') return null;

  const contractStatus = getContractReadiness(chainId);

  return (
    <div className="panel dashboard-panel">
      <header className="panel-header">
        <div>
          <h2>LandFi Protocol Dashboard</h2>
          <p className="panel-sub">Portfolio analytics, zone economics, and on-chain readiness</p>
        </div>
        <button className="icon-btn" onClick={() => setActivePanel(null)}><X size={18} /></button>
      </header>

      <div className="dashboard-grid">
        <div className="dash-card">
          <Shield size={18} />
          <label>Reputation</label>
          <strong>{reputation.tier}</strong>
          <small>Level {reputation.level} · Score {reputation.score}</small>
        </div>
        <div className="dash-card">
          <Coins size={18} />
          <label>Portfolio</label>
          <strong>{portfolioValue.toLocaleString()} META</strong>
          <small>{ownedParcels.length} parcels owned</small>
        </div>
        <div className="dash-card">
          <Layers size={18} />
          <label>Staked</label>
          <strong>{totalStaked.toLocaleString()} META</strong>
          <small>Governance power: {governancePower}</small>
        </div>
        <div className="dash-card">
          <TrendingUp size={18} />
          <label>Lifetime Yield</label>
          <strong>{totalEarned.toLocaleString()} META</strong>
          <small>Passive + venue revenue</small>
        </div>
      </div>

      {analytics && (
        <section className="panel-section">
          <h3><BarChart3 size={14} /> Market Overview</h3>
          <div className="analytics-row">
            <span>Floor price</span>
            <strong>{analytics.floorPrice.toLocaleString()} META</strong>
          </div>
          <div className="analytics-row">
            <span>Avg parcel price</span>
            <strong>{analytics.avgParcelPrice.toLocaleString()} META</strong>
          </div>
          <div className="analytics-row">
            <span>Occupancy</span>
            <strong>{analytics.occupancyRate}%</strong>
          </div>
          <div className="analytics-row">
            <span>Deeds minted</span>
            <strong>{marketStats.deedsMinted || 0}</strong>
          </div>
          <div className="analytics-row">
            <span>Total staked</span>
            <strong>{(marketStats.totalStaked || 0).toLocaleString()} META</strong>
          </div>
        </section>
      )}

      <section className="panel-section">
        <h3>Zone Economics</h3>
        <div className="zone-metrics-list">
          {Object.entries(zoneMetrics).map(([zone, m]) => (
            <div key={zone} className="zone-metric-row">
              <span className="zone-name" style={{ color: ZONE_COLORS[zone] }}>
                {ZONE_LABELS[zone] || zone}
              </span>
              <span>Floor {m.floorPrice?.toLocaleString()}</span>
              <span>{m.ownedCount}/{m.parcelCount} owned</span>
              <span>{m.deedsMinted} deeds</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section contract-status">
        <h3>On-Chain Status</h3>
        <p className={`contract-badge ${contractStatus.ready ? 'ready' : 'pending'}`}>
          {contractStatus.message}
        </p>
        {walletAddress ? (
          <p className="panel-sub">Wallet: {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}</p>
        ) : (
          <p className="panel-sub">Connect MetaMask to link wallet identity and mint land deeds.</p>
        )}
        {!isContractConfigured() && (
          <p className="panel-sub">Off-chain META economy active. Deploy contracts for settlement.</p>
        )}
      </section>
    </div>
  );
}
