import { Marker } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import { latLng } from 'leaflet';
import { getIncidenciaIcon } from '../../../utils/icons';
import type { IncidenciaFeature } from '../../../types';

interface IncidenciaMarkerProps {
  feature: IncidenciaFeature;
  setPoi: (latlng: LatLng) => void;
  onSelectIncidencia: (feature: IncidenciaFeature) => void;
}

export function IncidenciaMarker({
  feature,
  setPoi,
  onSelectIncidencia,
}: IncidenciaMarkerProps) {
  const coords = feature.geometry.coordinates;

  return (
    <Marker
      position={[coords[1], coords[0]]}
      icon={getIncidenciaIcon(feature.properties)}
      eventHandlers={{
        click: () => {
          setPoi(latLng(coords[1], coords[0]));
          onSelectIncidencia(feature);
        },
      }}
    />
  );
}