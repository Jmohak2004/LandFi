import { useEffect } from 'react';
import { MetaverseCanvas } from './components/MetaverseCanvas';
import { HUD } from './components/HUD';
import { PropertyPanel } from './components/PropertyPanel';
import { MarketplacePanel } from './components/MarketplacePanel';
import { EventsPanel } from './components/EventsPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { GovernancePanel } from './components/GovernancePanel';
import { ActivityPanel } from './components/ActivityPanel';
import { Minimap } from './components/Minimap';
import { Notifications } from './components/Notifications';
import { LoadingScreen } from './components/LoadingScreen';
import { useMetaverseStore } from './store/useMetaverseStore';

function App() {
  const loading = useMetaverseStore(s => s.loading);
  const fetchWorld = useMetaverseStore(s => s.fetchWorld);
  const parcels = useMetaverseStore(s => s.parcels);
  const selectedParcel = useMetaverseStore(s => s.selectedParcel);

  useEffect(() => {
    fetchWorld();
  }, [fetchWorld]);

  const isBooting = loading && parcels.length === 0;

  return (
    <div className="app">
      {isBooting && <LoadingScreen />}
      <MetaverseCanvas />
      <HUD />
      <Minimap />
      <Notifications />
      {selectedParcel && <PropertyPanel />}
      <DashboardPanel />
      <GovernancePanel />
      <ActivityPanel />
      <MarketplacePanel />
      <EventsPanel />
    </div>
  );
}

export default App;
