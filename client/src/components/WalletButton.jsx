import { useState } from 'react';
import { Wallet, LogOut, Link2, Loader2 } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function WalletButton() {
  const walletAddress = useMetaverseStore(s => s.walletAddress);
  const ethBalance = useMetaverseStore(s => s.ethBalance);
  const chainId = useMetaverseStore(s => s.chainId);
  const walletConnecting = useMetaverseStore(s => s.walletConnecting);
  const connectWallet = useMetaverseStore(s => s.connectWallet);
  const disconnectWallet = useMetaverseStore(s => s.disconnectWallet);
  const addNotification = useMetaverseStore(s => s.addNotification);

  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (e) {
      addNotification(e.message, 'error');
    }
  };

  if (walletAddress) {
    return (
      <div className="wallet-connected">
        <button className="wallet-btn connected" onClick={() => setShowMenu(!showMenu)}>
          <Wallet size={16} />
          <span>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
          {ethBalance && <small>{parseFloat(ethBalance).toFixed(4)} ETH</small>}
        </button>
        {showMenu && (
          <div className="wallet-menu">
            <div className="wallet-menu-row">
              <Link2 size={14} />
              <span>Chain ID: {chainId}</span>
            </div>
            <div className="wallet-menu-row muted">
              On-chain land via LandFi.sol (connect contract to enable)
            </div>
            <button className="wallet-menu-disconnect" onClick={() => { disconnectWallet(); setShowMenu(false); }}>
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button className="wallet-btn" onClick={handleConnect} disabled={walletConnecting}>
      {walletConnecting ? <Loader2 size={16} className="spin" /> : <Wallet size={16} />}
      <span>{walletConnecting ? 'Connecting…' : 'Connect MetaMask'}</span>
    </button>
  );
}
