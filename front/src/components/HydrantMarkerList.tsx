import { Marker } from 'react-leaflet';
import { latLng, LatLng } from 'leaflet';
import getHydrantIcon from '../utils/icons';
import { NodeWithForm } from './NodeForm';

interface HydrantMarkerListProps {
  features: any[];
  setPoi: (latlng: LatLng) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
}

export function HydrantMarkerList({ features, setPoi, showRoute, setShowRoute }: HydrantMarkerListProps) {
  return (
    <>
      {features.map((feature) => {
        const coords = feature.geometry.coordinates;
        return (
          <Marker
            key={feature.id}
            position={[coords[1], coords[0]]}
            icon={getHydrantIcon(feature.properties)}
            eventHandlers={{
              click: () => {
                setPoi(latLng(coords[1], coords[0]));
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
      })}
    </>
  );
}
