import { Marker, Circle } from 'react-leaflet';
import L, { latLng } from 'leaflet';
import getHydrantIcon from '../../../utils/icons';
import type { HidrantFeature } from '../../../hooks/useHidrantData';
import { clampToMaxDistance } from '../../../utils/geo';

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
  /** Radi màxim de moviment, definit pel backend (useAppConfig). Sense valor no s'arrossega. */
  maxMoveMeters?: number | null;
}

/**
 * Marcador d'hidrant. En clicar selecciona el node (la informació
 * es mostra al panell lateral / bottomsheet). Quan està seleccionat es marca subtilment.
 * En mode edició es pot arrossegar dins d'un radi de `maxMoveMeters`.
 */
export function HydrantMarker({
  feature,
  setPoi,
  onSelectNode,
  selected,
  draggable,
  overridePosition,
  onDragEnd,
  maxMoveMeters,
}: HydrantMarkerProps) {
  const coords = feature.geometry.coordinates;
  const originalLatLng = latLng(coords[1], coords[0]);
  const markerPosition = overridePosition ?? originalLatLng;
  const maxMeters = maxMoveMeters ?? null;

  return (
    <>
      {selected && <Marker position={markerPosition} icon={ringIcon} interactive={false} />}
      {draggable && maxMeters !== null && (
        <Circle
          center={originalLatLng}
          radius={maxMeters}
          pathOptions={{ color: '#3388ff', weight: 1, fillOpacity: 0.08 }}
          interactive={false}
        />
      )}
      <Marker
        position={markerPosition}
        icon={getHydrantIcon(feature.properties)}
        draggable={!!draggable && maxMeters !== null}
        eventHandlers={{
          click: () => {
            // En mode edició (draggable) el marcador ja és el node seleccionat: ignorem els clics.
            // Així no es pot reseleccionar (sortint de l'edició i perdent la posició arrossegada)
            // ni pel 'click' fantasma que Leaflet dispara just després del 'dragend', ni per un
            // clic simple accidental.
            if (draggable) {return;}
            setPoi(markerPosition);
            if (onSelectNode) {onSelectNode(feature);}
          },
          dragend: (e) => {
            if (maxMeters === null) {return;}
            const marker = e.target as L.Marker;
            const clamped = clampToMaxDistance(originalLatLng, marker.getLatLng(), maxMeters);
            marker.setLatLng(clamped);
            if (onDragEnd) {onDragEnd(clamped);}
          },
        }}
      />
    </>
  );
}
