import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { use, useEffect } from 'react';

export function LocateButton({
  style,
  onEdit,
  setPosition,
}: Readonly<{
  style?: React.CSSProperties;
  onEdit?: (latlng: L.LatLng) => void;
  setPosition: (latlng: L.LatLng | null) => void;
}>) {
  const { tracking, setTracking, position, accuracy } =
    useGeolocationTracking(onEdit);
  useEffect(() => {
    if (position) setPosition(position ?? null);
  }, [position]);
  return (
    <>
      <button
        onClick={() => setTracking((prev) => !prev)}
        style={{
          ...style,
          backgroundColor: tracking ? '#28a745' : '#007bff',
        }}
        title={
          tracking
            ? 'Desactiva el seguiment de la teva posició'
            : 'Activa el seguiment de la teva posició'
        }
      >
        📍
      </button>

      {position && (
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
                if (onEdit) onEdit(position);
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
      )}
    </>
  );
}
