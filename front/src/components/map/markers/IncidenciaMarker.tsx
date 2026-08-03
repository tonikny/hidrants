import { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { latLng, LatLng } from 'leaflet';
import { getIncidenciaIcon } from '../../../utils/icons';
import { IncidenciaFeature } from '../../../types';
import { IncidenciaPopup } from '../../incidents/IncidenciaPopup';

interface IncidenciaMarkerProps {
  feature: IncidenciaFeature;
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export function IncidenciaMarker({ 
  feature, 
  setPoi, 
  showRoute, 
  setShowRoute, 
  refreshIncidencies,
  hasLocation 
}: IncidenciaMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const coords = feature.geometry.coordinates;

  return (
    <Marker
      ref={markerRef}
      position={[coords[1], coords[0]]}
      icon={getIncidenciaIcon(feature.properties)}
      eventHandlers={{
        click: () => {
          setPoi(latLng(coords[1], coords[0]));
        }
      }}
    >
      <Popup minWidth={320} maxWidth={450}>
        <IncidenciaPopup 
          incidenciaId={feature.id}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshIncidencies={refreshIncidencies}
          hasLocation={hasLocation}
        />
      </Popup>
    </Marker>
  );
}
