import { Environment } from './Environment';
import { Player } from './Player';
import { RemotePlayers } from './RemotePlayers';
import { ParcelPlot } from './ParcelPlot';
import { PostFX } from './PostFX';
import { useMetaverseStore } from '../store/useMetaverseStore';

export function CityWorld() {
  const parcels = useMetaverseStore(s => s.parcels);
  const selectedParcel = useMetaverseStore(s => s.selectedParcel);
  const nearbyParcel = useMetaverseStore(s => s.nearbyParcel);

  return (
    <>
      <Environment />
      <Player />
      <RemotePlayers />
      {parcels.map(parcel => (
        <ParcelPlot
          key={parcel.id}
          parcel={parcel}
          isSelected={selectedParcel?.id === parcel.id}
          isNearby={nearbyParcel?.id === parcel.id}
        />
      ))}
      <PostFX />
    </>
  );
}
