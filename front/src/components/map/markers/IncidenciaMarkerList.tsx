import type { LatLng } from 'leaflet';
import { IncidenciaMarker } from './IncidenciaMarker';
import type { IncidenciaFeature } from '../../../types';

interface IncidenciaMarkerListProps {
  features: IncidenciaFeature[];
  setPoi: (latlng: LatLng) => void;
  onSelectIncidencia: (feature: IncidenciaFeature) => void;
}

export function IncidenciaMarkerList({
  features,
  setPoi,
  onSelectIncidencia,
}: IncidenciaMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
        <IncidenciaMarker
          key={feature.id}
          feature={feature}
          setPoi={setPoi}
          onSelectIncidencia={onSelectIncidencia}
        />
      ))}
    </>
  );
}
