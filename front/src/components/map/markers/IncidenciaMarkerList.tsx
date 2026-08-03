import { LatLng } from 'leaflet';
import { IncidentMarker } from './IncidentMarker';
import { IncidentFeature } from '../../../types';

interface IncidentMarkerListProps {
  features: IncidentFeature[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export function IncidentMarkerList({
  features,
  setPoi,
  showRoute,
  setShowRoute,
  refreshIncidencies,
  hasLocation,
}: IncidentMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
        <IncidentMarker
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
