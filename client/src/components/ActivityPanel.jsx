import { X, ArrowRightLeft } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';

const TX_LABELS = {
  buy: 'Land Acquisition',
  income: 'Yield Collection',
  mint_deed: 'Deed Minted',
  stake: 'META Staked',
  unstake: 'META Unstaked',
  governance_vote: 'DAO Vote',
  fractional_list: 'Fractional Listing',
  fractional_buy: 'Share Purchase',
  lease_list: 'Lease Listed',
  lease_rent: 'Lease Active',
};

export function ActivityPanel() {
  const activePanel = useMetaverseStore(s => s.activePanel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const transactions = useMetaverseStore(s => s.transactions);
  const fetchTransactions = useMetaverseStore(s => s.fetchTransactions);

  if (activePanel !== 'activity') return null;

  return (
    <div className="panel activity-panel">
      <header className="panel-header">
        <div>
          <h2>Protocol Activity Ledger</h2>
          <p className="panel-sub">On-chain-style transaction history across the metaverse</p>
        </div>
        <button className="icon-btn" onClick={() => setActivePanel(null)}><X size={18} /></button>
      </header>

      <button className="btn-outline" onClick={fetchTransactions}>Refresh ledger</button>

      <div className="activity-list">
        {transactions.length === 0 && (
          <p className="panel-sub">No transactions yet. Buy land, stake META, or vote on governance.</p>
        )}
        {transactions.map(tx => (
          <div key={tx.id} className={`activity-row type-${tx.type}`}>
            <ArrowRightLeft size={14} />
            <div className="activity-main">
              <strong>{TX_LABELS[tx.type] || tx.type}</strong>
              <small>
                {tx.parcelId && `Parcel ${tx.parcelId} · `}
                {new Date(tx.timestamp).toLocaleString()}
              </small>
            </div>
            {tx.amount > 0 && (
              <span className="activity-amount">{tx.amount.toLocaleString()} META</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
