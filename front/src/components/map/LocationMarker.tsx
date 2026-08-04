import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

export function LocationMarker({ 
  position, 
  accuracy, 
  onEdit 
}: { 
  position: L.LatLng | null; 
  accuracy: number | null; 
  onEdit?: (latlng: L.LatLng) => void;
}) {
  if (!position) {return null;}

  return (
    <>
      <Marker
        position={position}
        icon={L.icon({
          iconUrl: '/images/icons/marker-icon-green.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [0, -41],
        })}
        eventHandlers={{
          click: () => {
            if (onEdit) {onEdit(position);}
          },
        }}
      />
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: '#3388ff',
            opacity: 0.2,
            fillColor: '#3388ff',
            fillOpacity: 0.2,
          }}
        />
      )}
    </>
  );
}
