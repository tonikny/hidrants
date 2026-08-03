import { LatLng } from 'leaflet';
import { IncidenciaMarker } from './IncidenciaMarker';
import { IncidenciaFeature } from '../../../types';

interface IncidenciaMarkerListProps {
  features: IncidenciaFeature[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export function IncidenciaMarkerList({
  features,
  setPoi,
  showRoute,
  setShowRoute,
  refreshIncidencies,
  hasLocation,
}: IncidenciaMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
        <IncidenciaMarker
          key={feature.id}
          feature={feature}
          setPoi={setPoi}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshIncidencies={refreshIncidencies}
          hasLocation={hasLocation}
        />
      ))}
    </>
  );
}
