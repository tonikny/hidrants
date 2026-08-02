import { useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L, { latLng } from 'leaflet';
import getHydrantIcon from '../../../utils/icons';

const ringIcon = L.divIcon({
  className: '',
  html: '<div class="hydrant-ring"></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export interface HydrantMarkerProps {
  feature: any;
  setPoi: (latlng: L.LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshHidrants?: () => Promise<void>;
  hasLocation?: boolean;
  onSelectNode?: (feature: any) => void;
  selected?: boolean;
}

/**
 * Marcador d'hidrant. En clicar selecciona el node (la informació
 * es mostra al panell lateral / bottomsheet) i respon al centratge
 * via URL (?node=ID). Quan està seleccionat es marca subtilment.
 */
export function HydrantMarker({ feature, setPoi, onSelectNode, selected }: HydrantMarkerProps) {
  const coords = feature.geometry.coordinates;

  useEffect(() => {
    const handleCentered = (e: any) => {
      if (e.detail.nodeId === feature.id && onSelectNode) {
        onSelectNode(feature);
      }
    };

    window.addEventListener('map-node-centered', handleCentered);

    return () => window.removeEventListener('map-node-centered', handleCentered);
  }, [feature.id, feature, onSelectNode]);

  return (
    <>
      {selected && <Marker position={[coords[1], coords[0]]} icon={ringIcon} interactive={false} />}
      <Marker
        position={[coords[1], coords[0]]}
        icon={getHydrantIcon(feature.properties)}
        eventHandlers={{
          click: () => {
            setPoi(latLng(coords[1], coords[0]));
            if (onSelectNode) onSelectNode(feature);
          },
        }}
      />
    </>
  );
}
