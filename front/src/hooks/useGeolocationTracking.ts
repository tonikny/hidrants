import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { toast } from 'react-toastify';

export function useGeolocationTracking(onEdit?: (latlng: L.LatLng) => void) {
  const map = useMap();
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstUpdateRef = useRef(true);

  useEffect(() => {
    const onError = () => {
      toast.error('Permís de localització denegat o no disponible');
    };

    map.on('locationerror', onError);

    return () => {
      map.off('locationerror', onError);
    };
  }, [map]);

  useEffect(() => {
    if (tracking) {
      const geolocation = navigator.geolocation;
      if (!geolocation || typeof geolocation.watchPosition !== 'function') {
        toast.error('Geolocalització no disponible al teu navegador');
        setTracking(false);
        return;
      }

      toast.success('Seguiment de la posició activat');
      firstUpdateRef.current = true;

      watchIdRef.current = geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = L.latLng(latitude, longitude);
          setPosition(latlng);
          setAccuracy(accuracy);

          if (firstUpdateRef.current) {
            map.setView(latlng, 17);
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
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

    // ✅ Funció de neteja correcta
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, map]);

  return {
    tracking,
    setTracking,
    position,
    accuracy,
  };
}
