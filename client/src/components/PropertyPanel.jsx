import { useState } from 'react';
import { X, Coins, Hammer, Calendar, TrendingUp, Tag, Shield, Layers, Key, Percent, Home } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { ZONE_COLORS, RARITY_COLORS } from '../world/colors';

const BUILDINGS = [
  { id: 'gallery', label: 'Art Gallery', cost: 800, income: 12 },
  { id: 'shop', label: 'Commerce Hub', cost: 1200, income: 18 },
  { id: 'club', label: 'Venue & Events', cost: 1500, income: 28 },
  { id: 'office', label: 'Enterprise HQ', cost: 2000, income: 22 },
  { id: 'arena', label: 'Experience Arena', cost: 3500, income: 45 },
];

export function PropertyPanel() {
  const selectedParcel = useMetaverseStore(s => s.selectedParcel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const selectParcel = useMetaverseStore(s => s.selectParcel);
  const userId = useMetaverseStore(s => s.userId);
  const balance = useMetaverseStore(s => s.balance);
  const walletAddress = useMetaverseStore(s => s.walletAddress);
  const buyParcel = useMetaverseStore(s => s.buyParcel);
  const listParcel = useMetaverseStore(s => s.listParcel);
  const buildOnParcel = useMetaverseStore(s => s.buildOnParcel);
  const collectIncome = useMetaverseStore(s => s.collectIncome);
  const hostEvent = useMetaverseStore(s => s.hostEvent);
  const mintDeed = useMetaverseStore(s => s.mintDeed);
  const stakeOnParcel = useMetaverseStore(s => s.stakeOnParcel);
  const unstakeParcel = useMetaverseStore(s => s.unstakeParcel);
  const fractionalizeParcel = useMetaverseStore(s => s.fractionalizeParcel);
  const buyFractionalShares = useMetaverseStore(s => s.buyFractionalShares);
  const listLease = useMetaverseStore(s => s.listLease);
  const rentParcel = useMetaverseStore(s => s.rentParcel);
  const addNotification = useMetaverseStore(s => s.addNotification);

  const [listPrice, setListPrice] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [stakeAmount, setStakeAmount] = useState('500');
  const [fracShares, setFracShares] = useState('1000');
  const [fracPrice, setFracPrice] = useState('2');
  const [rentPerDay, setRentPerDay] = useState('50');
  const [leaseDays, setLeaseDays] = useState('7');
  const [loading, setLoading] = useState(false);

  if (!selectedParcel) return null;

  const p = selectedParcel;
  const owned = p.owner === userId;
  const price = p.listed && p.listPrice ? p.listPrice : p.price;
  const canBuy = !owned && (!p.owner || p.listed) && balance >= price;
  const myShares = p.sharesHeld?.[userId] || 0;

  const handle = async (fn) => {
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      addNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel property-panel">
      <div className="panel-glow" style={{ background: ZONE_COLORS[p.zone] }} />
      <header className="panel-header">
        <div>
          <span className="panel-badge" style={{ color: RARITY_COLORS[p.rarity] }}>{p.rarity}</span>
          <h2>{p.name}</h2>
          <p className="panel-zone" style={{ color: ZONE_COLORS[p.zone] }}>{p.zone}</p>
        </div>
        <button className="icon-btn" onClick={() => selectParcel(null)} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <p className="panel-desc">{p.description}</p>

      <div className="stat-grid">
        <div className="stat">
          <Coins size={16} />
          <span>{price.toLocaleString()} META</span>
        </div>
        <div className="stat">
          <TrendingUp size={16} />
          <span>{p.incomePerHour}/hr</span>
        </div>
        <div className="stat">
          <Tag size={16} />
          <span>{p.owner ? (owned ? 'Owned' : 'Private') : 'Available'}</span>
        </div>
      </div>

      {p.deedMinted && (
        <div className="deed-badge">
          <Shield size={14} /> Deed: {p.deedTokenId}
        </div>
      )}

      {p.stakeMultiplier > 1 && (
        <div className="stake-badge">
          <Layers size={14} /> {p.stakeMultiplier}x yield · {p.stakedAmount} META staked
        </div>
      )}

      {!owned && (
        <>
          <button
            className="btn-primary"
            disabled={!canBuy || loading}
            onClick={() => handle(() => buyParcel(p.id))}
          >
            {canBuy ? `Acquire Parcel — ${price} META` : 'Insufficient META'}
          </button>

          {p.fractionListing && p.fractionListing.seller !== userId && (
            <button
              className="btn-secondary"
              disabled={loading || balance < p.fractionListing.totalPrice}
              onClick={() => handle(() => buyFractionalShares(p.id))}
            >
              Buy {p.fractionListing.shares} shares — {p.fractionListing.totalPrice} META
            </button>
          )}

          {p.lease?.listed && p.owner !== userId && (
            <button
              className="btn-outline"
              disabled={loading || balance < p.lease.rentPerDay * p.lease.days}
              onClick={() => handle(() => rentParcel(p.id, p.lease.days))}
            >
              Rent — {p.lease.rentPerDay * p.lease.days} META ({p.lease.days}d)
            </button>
          )}
        </>
      )}

      {owned && (
        <>
          <section className="panel-section">
            <h3><Key size={14} /> Land Deed (ERC-1155)</h3>
            {p.deedMinted ? (
              <p className="panel-sub">Tokenized deed active. Parcel eligible for fractional liquidity.</p>
            ) : (
              <button
                className="btn-outline"
                disabled={loading || !walletAddress || balance < 250}
                onClick={() => handle(() => mintDeed(p.id))}
              >
                {!walletAddress
                  ? 'Connect wallet to mint deed'
                  : `Mint Land Deed (250 META)`}
              </button>
            )}
          </section>

          <section className="panel-section">
            <h3><Layers size={14} /> Yield Staking</h3>
            <input
              className="input-futuristic"
              type="number"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
            />
            <div className="btn-row">
              <button
                className="btn-secondary"
                disabled={loading || balance < Number(stakeAmount)}
                onClick={() => handle(() => stakeOnParcel(p.id, Number(stakeAmount)))}
              >
                Stake META
              </button>
              {p.stakedAmount > 0 && (
                <button
                  className="btn-outline"
                  disabled={loading}
                  onClick={() => handle(() => unstakeParcel(p.id))}
                >
                  Unstake All
                </button>
              )}
            </div>
          </section>

          <section className="panel-section">
            <h3><Hammer size={14} /> Develop & Monetize</h3>
            <div className="build-grid">
              {BUILDINGS.map(b => (
                <button
                  key={b.id}
                  className={`build-btn ${p.building === b.id ? 'active' : ''}`}
                  disabled={loading || balance < b.cost}
                  onClick={() => handle(() => buildOnParcel(p.id, b.id))}
                >
                  <span>{b.label}</span>
                  <small>{b.cost} META · +{b.income}/hr</small>
                </button>
              ))}
            </div>
          </section>

          {p.incomePerHour > 0 && (
            <button className="btn-secondary" disabled={loading} onClick={() => handle(() => collectIncome(p.id))}>
              Collect 8hr Yield (~{p.incomePerHour * 8} META)
            </button>
          )}

          {p.deedMinted && (
            <section className="panel-section">
              <h3><Percent size={14} /> Fractional Liquidity</h3>
              <p className="panel-sub">Your shares: {myShares.toLocaleString()} / {p.totalShares || 10000}</p>
              <input className="input-futuristic" type="number" placeholder="Shares" value={fracShares} onChange={e => setFracShares(e.target.value)} />
              <input className="input-futuristic" type="number" placeholder="META per share" value={fracPrice} onChange={e => setFracPrice(e.target.value)} />
              <button
                className="btn-outline"
                disabled={loading}
                onClick={() => handle(() => fractionalizeParcel(p.id, Number(fracShares), Number(fracPrice)))}
              >
                List Fractional Shares
              </button>
            </section>
          )}

          <section className="panel-section">
            <h3><Home size={14} /> Lease to Tenants</h3>
            <input className="input-futuristic" type="number" placeholder="Rent/day" value={rentPerDay} onChange={e => setRentPerDay(e.target.value)} />
            <input className="input-futuristic" type="number" placeholder="Days" value={leaseDays} onChange={e => setLeaseDays(e.target.value)} />
            <button
              className="btn-outline"
              disabled={loading}
              onClick={() => handle(() => listLease(p.id, Number(rentPerDay), Number(leaseDays)))}
            >
              List for Lease
            </button>
          </section>

          <section className="panel-section">
            <h3><Calendar size={14} /> Host Venue Event</h3>
            <input
              className="input-futuristic"
              placeholder="Event title..."
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
            />
            <button
              className="btn-accent"
              disabled={loading || balance < 500}
              onClick={() => handle(() => hostEvent(eventTitle || 'Metaverse Summit', p.id))}
            >
              Host Event (500 META)
            </button>
          </section>

          <section className="panel-section">
            <h3>List for Sale</h3>
            <input
              className="input-futuristic"
              type="number"
              placeholder="List price..."
              value={listPrice}
              onChange={e => setListPrice(e.target.value)}
            />
            <button
              className="btn-outline"
              disabled={loading || !listPrice}
              onClick={() => handle(() => listParcel(p.id, Number(listPrice)))}
            >
              List on Marketplace
            </button>
          </section>
        </>
      )}

      <button className="btn-ghost" onClick={() => setActivePanel('market')}>
        Open Full Marketplace
      </button>
    </div>
  );
}
