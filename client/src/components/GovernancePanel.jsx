import { useState } from 'react';
import { X, Vote, Check, XCircle } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function GovernancePanel() {
  const activePanel = useMetaverseStore(s => s.activePanel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const governance = useMetaverseStore(s => s.governance);
  const governancePower = useMetaverseStore(s => s.governancePower);
  const voteProposal = useMetaverseStore(s => s.voteProposal);
  const addNotification = useMetaverseStore(s => s.addNotification);
  const [loading, setLoading] = useState(null);

  if (activePanel !== 'governance') return null;

  const handleVote = async (proposalId, support) => {
    setLoading(proposalId);
    try {
      await voteProposal(proposalId, support);
    } catch (e) {
      addNotification(e.message, 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="panel governance-panel">
      <header className="panel-header">
        <div>
          <h2>LandFi DAO Governance</h2>
          <p className="panel-sub">Vote on protocol parameters · Your power: {governancePower}</p>
        </div>
        <button className="icon-btn" onClick={() => setActivePanel(null)}><X size={18} /></button>
      </header>

      <div className="governance-list">
        {governance.map(proposal => {
          const total = proposal.votesFor + proposal.votesAgainst;
          const forPct = total ? Math.round((proposal.votesFor / total) * 100) : 0;
          const isActive = proposal.status === 'active';

          return (
            <div key={proposal.id} className={`gov-card ${proposal.status}`}>
              <div className="gov-card-header">
                <span className={`gov-status ${proposal.status}`}>{proposal.status}</span>
                <span className="gov-id">{proposal.id}</span>
              </div>
              <h3>{proposal.title}</h3>
              <p className="gov-desc">{proposal.description}</p>

              <div className="gov-vote-bar">
                <div className="gov-vote-for" style={{ width: `${forPct}%` }} />
              </div>
              <div className="gov-vote-stats">
                <span>For: {proposal.votesFor.toLocaleString()}</span>
                <span>Against: {proposal.votesAgainst.toLocaleString()}</span>
                <span>Quorum: {proposal.quorum.toLocaleString()}</span>
              </div>

              {isActive && (
                <div className="gov-actions">
                  <button
                    className="btn-vote-for"
                    disabled={loading === proposal.id}
                    onClick={() => handleVote(proposal.id, true)}
                  >
                    <Check size={14} /> Vote For
                  </button>
                  <button
                    className="btn-vote-against"
                    disabled={loading === proposal.id}
                    onClick={() => handleVote(proposal.id, false)}
                  >
                    <XCircle size={14} /> Vote Against
                  </button>
                </div>
              )}

              {!isActive && (
                <p className="gov-ended">Ended {proposal.endsAt}</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="panel-sub gov-footer">
        <Vote size={12} /> Governance power scales with owned parcels and staked META.
      </p>
    </div>
  );
}
