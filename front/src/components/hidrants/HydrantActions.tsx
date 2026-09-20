import type { HidrantFeature } from "../../hooks/useHidrantData";
import { NodeActions } from "../shared/NodeActions";

export function HydrantActions({
  feature,
  showRoute,
  setShowRoute,
  hasLocation,
}: {
  feature: HidrantFeature;
  showRoute?: boolean;
  setShowRoute?: (v: boolean) => void;
  hasLocation?: boolean;
}) {
  const [lon, lat] = feature.geometry.coordinates;

  return (
    <NodeActions
      nodeId={feature.id}
      lat={lat}
      lon={lon}
      showRoute={showRoute}
      setShowRoute={setShowRoute}
      hasLocation={hasLocation}
    />
  );
}
