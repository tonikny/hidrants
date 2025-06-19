import { Marker, Circle, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'react-toastify';

export function LocateButton({ style }: { style?: React.CSSProperties }) {
  const map = useMap();
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (tracking) {
      if (!navigator.geolocation) {
        toast.error('El teu navegador no suporta geolocalització');
        setTracking(false);
        return;
      }

      toast.success('Seguiment de la posició activat');

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = L.latLng(latitude, longitude);
          setPosition(latlng);
          setAccuracy(accuracy);
          map.setView(latlng);
        },
        () => {
          toast.error("No s'ha pogut obtenir la teva posició");
          setTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000,
        }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        toast.info('Seguiment de la posició desactivat');
      }
      setPosition(null);
      setAccuracy(null);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tracking, map]);

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
          />
          {accuracy && (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{
                color: '#3388ff',
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
