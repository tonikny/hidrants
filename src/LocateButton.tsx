import { Marker, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'react-toastify';

export function LocateButton({ style }: { style?: React.CSSProperties }) {
  const map = useMap();
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (tracking) {
      if (!navigator.geolocation) {
        toast.error('El teu navegador no suporta geolocalització');
        setTracking(false);
        return;
      }

      toast.info('Seguiment de la posició activat');

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(latlng);
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
        <Marker
          position={position}
          icon={L.icon({
            iconUrl: '/images/icons/marker-icon-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41],
          })}
        />
      )}
    </>
  );
}
