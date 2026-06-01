import { LatLng } from 'leaflet';
import { HydrantMarker } from './HydrantMarker';

interface HydrantMarkerListProps {
  features: any[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshHidrants?: () => Promise<void>;
}

export function HydrantMarkerList({
  features,
  setPoi,
  showRoute,
  setShowRoute,
  refreshHidrants,
}: HydrantMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
        /* Renderitza cada marcador d'hidrant de forma independent */
        <HydrantMarker
          key={feature.id}
          feature={feature}
          setPoi={setPoi}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshHidrants={refreshHidrants}
        />
      ))}
    </>
  );
}
