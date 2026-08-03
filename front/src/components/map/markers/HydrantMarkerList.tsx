import { LatLng } from 'leaflet';
import { HydrantMarker } from './HydrantMarker';

interface HydrantMarkerListProps {
  features: any[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshHidrants?: () => Promise<void>;
  hasLocation?: boolean;
  onSelectNode?: (feature: any) => void;
  selectedNodeId?: string | null;
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
}: HydrantMarkerListProps) {
  return (
    <>
      {features.map((feature) => (
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
        />
      ))}
    </>
  );
}
