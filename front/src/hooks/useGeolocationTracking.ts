import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { toast } from 'react-toastify';

const geoAvailable = typeof navigator.geolocation?.watchPosition === 'function';

export function useGeolocationTracking() {
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
    if (tracking && !geoAvailable) {
      return;
    }

    if (tracking) {
      toast.success('Seguiment de la posició activat');
      firstUpdateRef.current = true;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // @ts-expect-error accés intern de Leaflet per verificar estat del mapa
          if (!map?._loaded || !map.getContainer()) {return;}

          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = L.latLng(latitude, longitude);
          setPosition(latlng);
          setAccuracy(accuracy);

          if (firstUpdateRef.current) {
            map.setView(latlng, 17);
            setTimeout(() => {
              // @ts-expect-error accés intern de Leaflet per verificar estat del mapa
              if (map?._loaded && map.getContainer()) {
                map.invalidateSize();
              }
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
    }

    // ✅ Funció de neteja correcta
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, map]);

  const toggleTracking = () => {
    if (!tracking && !geoAvailable) {
      toast.error('Geolocalització no disponible al teu navegador');
      return;
    }
    setTracking((prev) => !prev);
    if (tracking) {
      setPosition(null);
      setAccuracy(null);
    }
  };

  return {
    tracking,
    toggleTracking,
    position,
    accuracy,
  };
}
