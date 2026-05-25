import { X, Search } from 'lucide-react';
import { useState } from 'react';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { ZONE_COLORS, RARITY_COLORS } from '../world/colors';

export function MarketplacePanel() {
  const activePanel = useMetaverseStore(s => s.activePanel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const parcels = useMetaverseStore(s => s.parcels);
  const selectParcel = useMetaverseStore(s => s.selectParcel);
  const marketStats = useMetaverseStore(s => s.marketStats);
  const userId = useMetaverseStore(s => s.userId);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (activePanel !== 'market') return null;

  const filtered = parcels.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.zone.includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'available') return !p.owner;
    if (filter === 'listed') return p.listed;
    if (filter === 'owned') return p.owner === userId;
    if (filter === 'legendary') return p.rarity === 'legendary';
    return true;
  });

  return (
    <div className="panel marketplace-panel">
      <header className="panel-header">
        <div>
          <h2>Land Marketplace</h2>
          <p className="panel-sub">
            Volume {(marketStats.totalVolume || 0).toLocaleString()} META · {marketStats.activeListings || 0} active listings · {marketStats.deedsMinted || 0} deeds minted
          </p>
        </div>
        <button className="icon-btn" onClick={() => setActivePanel(null)}><X size={18} /></button>
      </header>

      <div className="market-filters">
        {['all', 'available', 'listed', 'owned', 'legendary'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input placeholder="Search zones, plots..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="market-list">
        {filtered.map(p => (
          <button
            key={p.id}
            className="market-item"
            onClick={() => { selectParcel(p); setActivePanel('property'); }}
          >
            <div className="market-item-left">
              <span className="rarity-dot" style={{ background: RARITY_COLORS[p.rarity] }} />
              <div>
                <strong>{p.name}</strong>
                <small style={{ color: ZONE_COLORS[p.zone] }}>{p.zone}</small>
              </div>
            </div>
            <div className="market-item-right">
              <span className="price">{(p.listed ? p.listPrice : p.price).toLocaleString()} META</span>
              {p.listed && <span className="badge-sale">SALE</span>}
              {p.owner === userId && <span className="badge-owned">OWNED</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
