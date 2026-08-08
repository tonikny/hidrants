import { Marker } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import L, { latLng } from 'leaflet';
import { getIncidenciaIcon } from '../../../utils/icons';
import type { IncidenciaFeature } from '../../../types';

const ringIcon = L.divIcon({
  className: '',
  html: '<div class="incidencia-ring"></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

interface IncidenciaMarkerProps {
  feature: IncidenciaFeature;
  setPoi: (latlng: LatLng) => void;
  onSelectIncidencia: (feature: IncidenciaFeature) => void;
  selected?: boolean;
}

export function IncidenciaMarker({
  feature,
  setPoi,
  onSelectIncidencia,
  selected,
}: IncidenciaMarkerProps) {
  const coords = feature.geometry.coordinates;

  return (
    <>
      {selected && <Marker position={[coords[1], coords[0]]} icon={ringIcon} interactive={false} />}
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
    </>
  );
}