import { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { latLng, LatLng } from 'leaflet';
import { getIncidentIcon } from '../../../utils/icons';
import { IncidentFeature } from '../../../types';
import { IncidentPopup } from '../../ui/IncidentPopup';

interface IncidentMarkerProps {
  feature: IncidentFeature;
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export function IncidentMarker({ 
  feature, 
  setPoi, 
  showRoute, 
  setShowRoute, 
  refreshIncidencies,
  hasLocation 
}: IncidentMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const coords = feature.geometry.coordinates;

  return (
    <Marker
      ref={markerRef}
      position={[coords[1], coords[0]]}
      icon={getIncidentIcon(feature.properties)}
      eventHandlers={{
        click: () => {
          setPoi(latLng(coords[1], coords[0]));
        }
      }}
    >
      <Popup minWidth={300} maxWidth={400}>
        <IncidentPopup 
          incidentId={feature.id}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshIncidencies={refreshIncidencies}
          hasLocation={hasLocation}
        />
      </Popup>
    </Marker>
  );
}
