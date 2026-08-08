import type { LatLng } from 'leaflet';
import { IncidenciaMarker } from './IncidenciaMarker';
import type { IncidenciaFeature } from '../../../types';

interface IncidenciaMarkerListProps {
  features: IncidenciaFeature[];
  setPoi: (latlng: LatLng) => void;
  onSelectIncidencia: (feature: IncidenciaFeature) => void;
  selectedIncidenciaId?: string | null;
}

export function IncidenciaMarkerList({
  features,
  setPoi,
  onSelectIncidencia,
  selectedIncidenciaId,
}: IncidenciaMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
        <IncidenciaMarker
          key={feature.id}
          feature={feature}
          setPoi={setPoi}
          onSelectIncidencia={onSelectIncidencia}
          selected={selectedIncidenciaId === feature.id}
        />
      ))}
    </>
  );
}
