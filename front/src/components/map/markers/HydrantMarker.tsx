import { useEffect, useRef } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L, { latLng } from 'leaflet';
import getHydrantIcon from '../../../utils/icons';
import type { HidrantFeature } from '../../../hooks/useHidrantData';
import { clampToMaxDistance, MAX_HYDRANT_MOVE_METERS } from '../../../utils/geo';

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
  draggable?: boolean;
  overridePosition?: L.LatLng | null;
  onDragEnd?: (latlng: L.LatLng) => void;
}

/**
 * Marcador d'hidrant. En clicar selecciona el node (la informació
 * es mostra al panell lateral / bottomsheet) i respon al centratge
 * via URL (?node=ID). Quan està seleccionat es marca subtilment.
 */
export function HydrantMarker({
  feature,
  setPoi,
  onSelectNode,
  selected,
  draggable,
  overridePosition,
  onDragEnd,
}: HydrantMarkerProps) {
  const coords = feature.geometry.coordinates;
  const originalLatLng = latLng(coords[1], coords[0]);
  const markerPosition = overridePosition ?? originalLatLng;
  // Leaflet dispara un 'click' fantasma just després del 'dragend' sobre el mateix
  // marcador; l'ignorem perquè no reobri/reseleccioni el node en soltar l'arrossegament.
  const justDraggedRef = useRef(false);

  useEffect(() => {
    const handleCentered = (e: Event) => {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      if (nodeId === feature.id && onSelectNode) {
        onSelectNode(feature);
      }
    };

    window.addEventListener('map-node-centered', handleCentered);

    return () => window.removeEventListener('map-node-centered', handleCentered);
  }, [feature.id, feature, onSelectNode]);

  return (
    <>
      {selected && <Marker position={markerPosition} icon={ringIcon} interactive={false} />}
      {draggable && (
        <Circle
          center={originalLatLng}
          radius={MAX_HYDRANT_MOVE_METERS}
          pathOptions={{ color: '#3388ff', weight: 1, fillOpacity: 0.08 }}
          interactive={false}
        />
      )}
      <Marker
        position={markerPosition}
        icon={getHydrantIcon(feature.properties)}
        draggable={!!draggable}
        eventHandlers={{
          click: () => {
            if (justDraggedRef.current) {
              justDraggedRef.current = false;
              return;
            }
            setPoi(markerPosition);
            if (onSelectNode) {onSelectNode(feature);}
          },
          dragend: (e) => {
            justDraggedRef.current = true;
            setTimeout(() => { justDraggedRef.current = false; }, 300);
            const dragged = (e.target as L.Marker).getLatLng();
            const clamped = clampToMaxDistance(originalLatLng, dragged, MAX_HYDRANT_MOVE_METERS);
            (e.target as L.Marker).setLatLng(clamped);
            if (onDragEnd) {onDragEnd(clamped);}
          },
        }}
      />
    </>
  );
}
