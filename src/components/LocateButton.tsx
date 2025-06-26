import { Marker, Circle, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'react-toastify';

export function LocateButton({
  style,
  onEdit,
}: Readonly<{
  style?: React.CSSProperties;
  onEdit?: (latlng: L.LatLng) => void;
}>) {
  const map = useMap();
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstUpdateRef = useRef(true);

  useEffect(() => {
    if (tracking) {
      const geolocation = navigator.geolocation;
      if (
        !geolocation ||
        typeof geolocation !== 'object' ||
        Object.keys(geolocation).length === 0 ||
        typeof geolocation.watchPosition !== 'function'
      ) {
        toast.error('Geolocalització no disponible al teu navegador');
        setTracking(false);
        return;
      }

      toast.success('Seguiment de la posició activat');
      firstUpdateRef.current = true;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = L.latLng(latitude, longitude);
          setPosition(latlng);
          setAccuracy(accuracy);

          if (firstUpdateRef.current) {
            map.setView(latlng, 17);
            setTimeout(() => {
              map.invalidateSize(); // força recalcul de dimensions
            }, 100); // petit delay perquè el DOM s’hagi renderitzat
            firstUpdateRef.current = false;
          }
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
        watchIdRef.current = null;
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
