import type { HidrantFeature } from "../../hooks/useHidrantData";
import { NodeActions } from "../shared/NodeActions";
import type { User } from "../../contexts/AuthContext";

export function HydrantActions({
  feature,
  showRoute,
  setShowRoute,
  hasLocation,
  user,
}: {
  feature: HidrantFeature;
  showRoute?: boolean;
  setShowRoute?: (v: boolean) => void;
  hasLocation?: boolean;
  user: User | null;
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
      osmId={feature.properties.osm_id}
      showOsmLink={(user?.permissions ?? []).includes("view_osm_link")}
    />
  );
}