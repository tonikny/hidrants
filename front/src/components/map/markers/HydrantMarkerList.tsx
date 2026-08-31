import type { LatLng } from 'leaflet';
import { HydrantMarker } from './HydrantMarker';
import type { HidrantFeature } from '../../../hooks/useHidrantData';

interface HydrantMarkerListProps {
  features: HidrantFeature[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshHidrants?: () => void;
  hasLocation?: boolean;
  onSelectNode?: (feature: HidrantFeature) => void;
  selectedNodeId?: string | null;
  editingNodeId?: string | null;
  draftPosition?: LatLng | null;
  onNodeDrag?: (latlng: LatLng) => void;
}

export function HydrantMarkerList({
  features,
  setPoi,
  showRoute,
  setShowRoute,
  refreshHidrants,
  hasLocation,
  onSelectNode,
  selectedNodeId,
  editingNodeId,
  draftPosition,
  onNodeDrag,
}: HydrantMarkerListProps) {
  return (
    <>
      {features.map((feature) => {
        const isEditingThisNode = !!editingNodeId && feature.id === editingNodeId;
        return (
          /* Renderitza cada marcador d'hidrant de forma independent */
          <HydrantMarker
            key={feature.id}
            feature={feature}
            setPoi={setPoi}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            refreshHidrants={refreshHidrants}
            hasLocation={hasLocation}
            onSelectNode={onSelectNode}
            selected={selectedNodeId === feature.id}
            draggable={isEditingThisNode}
            overridePosition={isEditingThisNode ? draftPosition : null}
            onDragEnd={isEditingThisNode ? onNodeDrag : undefined}
          />
        );
      })}
    </>
  );
}
