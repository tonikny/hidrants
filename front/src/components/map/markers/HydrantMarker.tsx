import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L, { latLng, LatLng } from 'leaflet';
import getHydrantIcon from '../../../utils/icons';
import { NodeWithForm } from '../../ui/NodeForm';

export interface HydrantMarkerProps {
  feature: any;
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
}

/**
 * Marcador d'hidrant que gestiona la seva pròpia aparició a la URL
 * i respon a l'esdeveniment de centratge del mapa.
 */
export function HydrantMarker({ feature, setPoi, showRoute, setShowRoute }: HydrantMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const coords = feature.geometry.coordinates;

  useEffect(() => {
    const handleCentered = (e: any) => {
      if (e.detail.nodeId === feature.id && markerRef.current) {
        setTimeout(() => {
          if (markerRef.current) markerRef.current.openPopup();
        }, 50);
      }
    };

    window.addEventListener('map-node-centered', handleCentered);

    return () => window.removeEventListener('map-node-centered', handleCentered);
  }, [feature.id]);

  const updateUrl = (nodeId: string | null) => {
    const url = new URL(window.location.href);
    if (nodeId) {
      url.searchParams.set('node', nodeId);
    } else {
      url.searchParams.delete('node');
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <Marker
      ref={markerRef}
      position={[coords[1], coords[0]]}
      icon={getHydrantIcon(feature.properties)}
      eventHandlers={{
        click: () => {
          setPoi(latLng(coords[1], coords[0]));
        },
        popupopen: () => {
          updateUrl(feature.id);
        },
        popupclose: () => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('node') === feature.id) {
            updateUrl(null);
          }
        },
      }}
    >
      <NodeWithForm
        feature={feature}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
      />
    </Marker>
  );
}
