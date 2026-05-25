import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectMetaMask, getWalletState, onAccountsChanged, onChainChanged } from '../lib/wallet';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001');

const generateUserId = () => {
  const stored = localStorage.getItem('landi-user-id');
  if (stored) return stored;
  const id = `user_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem('landi-user-id', id);
  return id;
};

let walletListenersSetup = false;

export const useMetaverseStore = create(
  persist(
    (set, get) => ({
      userId: generateUserId(),
      displayName: 'Guest Explorer',
      balance: 25000,
      totalEarned: 0,
      totalStaked: 0,
      ownedParcels: [],
      portfolioValue: 0,
      reputation: { tier: 'Explorer', level: 1, score: 0 },
      governancePower: 1,

      walletAddress: null,
      ethBalance: null,
      chainId: null,
      walletConnecting: false,

      avatarColor: '#00f0ff',
      remotePlayers: [],
      onlineCount: 1,
      multiplayerConnected: false,
      vrActive: false,

      parcels: [],
      events: [],
      marketStats: {},
      buildingTypes: [],
      governance: [],
      zoneMetrics: {},
      analytics: null,
      transactions: [],

      selectedParcel: null,
      nearbyParcel: null,
      activePanel: null,
      loading: false,
      error: null,
      notifications: [],

      playerPosition: [0, 0, 0],
      isMoving: false,
      showMinimap: true,
      dayPhase: 0.35,
      timeOfDay: 0.7,
      radioOn: false,

      setVrActive: (active) => set({ vrActive: active }),

      addNotification: (message, type = 'info') => {
        const id = Date.now();
        set(s => ({
          notifications: [{ id, message, type }, ...s.notifications].slice(0, 5),
        }));
        setTimeout(() => {
          set(s => ({
            notifications: s.notifications.filter(n => n.id !== id),
          }));
        }, 4000);
      },

      setPlayerPosition: (pos) => set({ playerPosition: pos }),
      setNearbyParcel: (parcel) => set({ nearbyParcel: parcel }),
      selectParcel: (parcel) => set({ selectedParcel: parcel, activePanel: parcel ? 'property' : null }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
      toggleRadio: () => {
        const next = !get().radioOn;
        set({ radioOn: next });
        get().addNotification(next ? 'Ambient city audio enabled' : 'Ambient audio disabled', 'info');
      },

      connectWallet: async () => {
        set({ walletConnecting: true });
        try {
          const wallet = await connectMetaMask();
          const address = wallet.address;

          await fetch(`${API}/api/user/${address}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address }),
          });

          localStorage.setItem('landi-user-id', address);

          set({
            userId: address,
            walletAddress: address,
            ethBalance: wallet.ethBalance,
            chainId: wallet.chainId,
            displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
            walletConnecting: false,
          });

          await get().fetchWorld();
          get().addNotification('MetaMask connected — wallet is your identity', 'success');

          if (!walletListenersSetup) {
            walletListenersSetup = true;
            onAccountsChanged((accounts) => {
              if (!accounts.length) get().disconnectWallet();
              else if (accounts[0].toLowerCase() !== get().walletAddress) {
                get().connectWallet();
              }
            });
            onChainChanged(() => get().refreshWallet());
          }
        } catch (e) {
          set({ walletConnecting: false });
          throw e;
        }
      },

      disconnectWallet: () => {
        const guestId = `user_${Math.random().toString(36).slice(2, 11)}`;
        localStorage.setItem('landi-user-id', guestId);
        set({
          userId: guestId,
          walletAddress: null,
          ethBalance: null,
          chainId: null,
          displayName: 'Guest Explorer',
        });
        get().fetchWorld();
        get().addNotification('Wallet disconnected', 'info');
      },

      refreshWallet: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;
        const state = await getWalletState(walletAddress);
        if (state) set({ ethBalance: state.ethBalance, chainId: state.chainId });
      },

      fetchWorld: async () => {
        set({ loading: true, error: null });
        try {
          const [worldRes, userRes, txRes, analyticsRes] = await Promise.all([
            fetch(`${API}/api/world`),
            fetch(`${API}/api/user/${get().userId}`),
            fetch(`${API}/api/transactions`),
            fetch(`${API}/api/analytics`),
          ]);
          const world = await worldRes.json();
          const user = await userRes.json();
          const transactions = txRes.ok ? await txRes.json() : [];
          const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
          set({
            parcels: world.parcels,
            events: world.events,
            marketStats: world.marketStats,
            buildingTypes: world.buildingTypes,
            governance: world.governance || [],
            zoneMetrics: world.zoneMetrics || {},
            analytics,
            transactions,
            balance: user.balance,
            totalEarned: user.totalEarned,
            totalStaked: user.totalStaked || 0,
            ownedParcels: user.ownedParcels,
            portfolioValue: user.portfolioValue,
            reputation: user.reputation || get().reputation,
            governancePower: user.governancePower || 1,
            displayName: user.displayName || get().displayName,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: e.message });
          get().addNotification('Offline mode — using cached world', 'warn');
        }
      },

      refreshUser: async () => {
        try {
          const res = await fetch(`${API}/api/user/${get().userId}`);
          const user = await res.json();
          set({
            balance: user.balance,
            totalEarned: user.totalEarned,
            totalStaked: user.totalStaked || 0,
            ownedParcels: user.ownedParcels,
            portfolioValue: user.portfolioValue,
            reputation: user.reputation,
            governancePower: user.governancePower || 1,
          });
        } catch (_) {}
      },

      buyParcel: async (parcelId) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          selectedParcel: data.parcel,
        }));
        await get().refreshUser();
        get().addNotification(`Acquired ${data.parcel.name}!`, 'success');
        return data;
      },

      listParcel: async (parcelId, listPrice) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, listPrice }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          selectedParcel: data.parcel,
        }));
        get().addNotification('Listed on marketplace', 'success');
      },

      buildOnParcel: async (parcelId, building) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, building }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          selectedParcel: data.parcel,
        }));
        get().addNotification(`Built ${building} — earning ${data.parcel.incomePerHour} META/hr`, 'success');
      },

      collectIncome: async (parcelId) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/collect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, hours: 8 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set({ balance: data.user.balance, totalEarned: data.user.totalEarned });
        get().addNotification(`Collected ${data.earned} META`, 'success');
      },

      fetchTransactions: async () => {
        try {
          const res = await fetch(`${API}/api/transactions`);
          const transactions = await res.json();
          set({ transactions });
        } catch (_) {}
      },

      voteProposal: async (proposalId, support) => {
        const res = await fetch(`${API}/api/governance/${proposalId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, support }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          governance: s.governance.map(p => (p.id === proposalId ? data.proposal : p)),
          governancePower: data.user.governancePower,
        }));
        get().addNotification(`Vote recorded (${support ? 'For' : 'Against'})`, 'success');
        await get().fetchTransactions();
      },

      mintDeed: async (parcelId) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/mint-deed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          selectedParcel: data.parcel,
        }));
        await get().refreshUser();
        get().addNotification(`Land deed minted: ${data.deed.tokenId}`, 'success');
        await get().fetchTransactions();
      },

      stakeOnParcel: async (parcelId, amount) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/stake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          totalStaked: data.user.totalStaked,
          selectedParcel: data.parcel,
        }));
        get().addNotification(`Staked ${amount} META — ${data.parcel.stakeMultiplier}x yield`, 'success');
      },

      unstakeParcel: async (parcelId, amount) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/unstake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          totalStaked: data.user.totalStaked,
          selectedParcel: data.parcel,
        }));
        get().addNotification(`Unstaked ${amount || 'all'} META`, 'success');
      },

      fractionalizeParcel: async (parcelId, shares, pricePerShare) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/fractionalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, shares, pricePerShare }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          selectedParcel: data.parcel,
        }));
        get().addNotification(`Listed ${shares} fractional shares`, 'success');
      },

      buyFractionalShares: async (parcelId) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/buy-shares`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          selectedParcel: data.parcel,
        }));
        await get().refreshUser();
        get().addNotification('Fractional shares acquired', 'success');
      },

      listLease: async (parcelId, rentPerDay, days) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/lease`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, rentPerDay, days }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          selectedParcel: data.parcel,
        }));
        get().addNotification('Parcel listed for lease', 'success');
      },

      rentParcel: async (parcelId, days) => {
        const res = await fetch(`${API}/api/parcels/${parcelId}/rent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: get().userId, days }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          parcels: s.parcels.map(p => (p.id === parcelId ? data.parcel : p)),
          balance: data.user.balance,
          selectedParcel: data.parcel,
        }));
        get().addNotification('Lease agreement active', 'success');
      },

      hostEvent: async (title, parcelId) => {
        const parcel = get().parcels.find(p => p.id === parcelId);
        const res = await fetch(`${API}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: get().userId,
            title,
            zone: parcel?.zone,
            parcelId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        set(s => ({
          events: [data.event, ...s.events],
          balance: data.user.balance,
        }));
        get().addNotification(`Event hosted! +${data.event.revenue} META`, 'success');
      },
    }),
    {
      name: 'landi-metaverse',
      partialize: (s) => ({
        userId: s.userId,
        displayName: s.displayName,
        walletAddress: s.walletAddress,
      }),
    }
  )
);

// Restore wallet session on load
if (typeof window !== 'undefined') {
  const init = useMetaverseStore.getState();
  if (init.walletAddress) {
    getWalletState(init.walletAddress).then(state => {
      if (state) {
        useMetaverseStore.setState({
          ethBalance: state.ethBalance,
          chainId: state.chainId,
          userId: init.walletAddress,
        });
      }
    });
  }
}
