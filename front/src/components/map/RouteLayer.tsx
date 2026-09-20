import { useEffect, useState, useRef } from 'react';
import { Polyline, Tooltip, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import { toast } from 'react-toastify';
import { logError } from '../../utils/log';

interface RouteLayerProps {
  from: L.LatLng;
  to: L.LatLng;
  color?: string;
}

export function RouteLayer({ from, to, color = '#0077ff' }: RouteLayerProps) {
  const map = useMap();
  const [coords, setCoords] = useState<LatLngExpression[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  const lastFetchPos = useRef<L.LatLng | null>(null);
  const lastDest = useRef<string>('');
  const hasFittedBounds = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    
    // Identificador únic del destí
    const destId = `${to.lat},${to.lng}`;
    
    // 1. Decidir si cal fer una nova petició al servidor
    // Cal fer petició si:
    // - No tenim una posició anterior
    // - El destí ha canviat
    // - Ens hem mogut més de 20 metres
    const shouldFetch = 
      !lastFetchPos.current || 
      lastDest.current !== destId || 
      lastFetchPos.current.distanceTo(from) > 20;

    if (!shouldFetch) {return;}

    const url = `/api/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}`;
    
    fetch(url)
      .then((res) => {
        if (!res.ok) {throw new Error('Error al servidor de rutes');}
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {return;}
        
        if (data.paths && data.paths.length > 0) {
          const route = data.paths[0];
          const points: LatLngExpression[] = route.points.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          
          setCoords(points);
          setDistance(route.distance / 1000);
          setDuration(route.time / 60000);
          
          // Guardem l'estat de la petició actual
          lastFetchPos.current = from;
          lastDest.current = destId;
          
          // 2. Decidir si cal ajustar el zoom del mapa
          // Només ho fem la primera vegada que es carrega la ruta cap a aquest destí
          if (hasFittedBounds.current !== destId) {
            map.whenReady(() => {
              if (map.getContainer()) {
                map.fitBounds(points as L.LatLngBoundsExpression, {
                  padding: [50, 50],
                });
                hasFittedBounds.current = destId;
              }
            });
          }
        } else if (data.error) {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        if (isMounted) {
          logError('Error carregant ruta', err);
          toast.error('No s’ha pogut calcular la ruta.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [from, to, map]);

  const midpoint =
    coords.length > 0 ? coords[Math.floor(coords.length / 2)] : null;

  if (!coords.length) {return null;}

  return (
    <>
      {/* Ombra */}
      <Polyline
        positions={coords}
        color="#666"
        weight={10}
        opacity={0.3}
        smoothFactor={2}
      />
      {/* Línia principal */}
      <Polyline
        positions={coords}
        color={color}
        weight={6}
        opacity={0.9}
        smoothFactor={2}
      >
        {midpoint && distance && duration && (
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {Math.round(duration)} min – {distance.toFixed(1)} km
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}
