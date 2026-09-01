import { Marker } from 'react-leaflet';
import L, { latLng } from 'leaflet';
import getHydrantIcon from '../../../utils/icons';
import type { HidrantFeature } from '../../../hooks/useHidrantData';

const ringIcon = L.divIcon({
  className: '',
  html: '<div class="hydrant-ring"></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export interface HydrantMarkerProps {
  feature: HidrantFeature;
  setPoi: (latlng: L.LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshHidrants?: () => void;
  hasLocation?: boolean;
  onSelectNode?: (feature: HidrantFeature) => void;
  selected?: boolean;
}

/**
 * Marcador d'hidrant. En clicar selecciona el node (la informació
 * es mostra al panell lateral / bottomsheet). Quan està seleccionat es marca subtilment.
 */
export function HydrantMarker({ feature, setPoi, onSelectNode, selected }: HydrantMarkerProps) {
  const coords = feature.geometry.coordinates;

  return (
    <>
      {selected && <Marker position={[coords[1], coords[0]]} icon={ringIcon} interactive={false} />}
      <Marker
        position={[coords[1], coords[0]]}
        icon={getHydrantIcon(feature.properties)}
        eventHandlers={{
          click: () => {
            setPoi(latLng(coords[1], coords[0]));
            if (onSelectNode) {onSelectNode(feature);}
          },
        }}
      />
    </>
  );
}
