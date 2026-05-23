import { useEffect, useState } from 'react';
import { Polyline, Tooltip, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

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

  useEffect(() => {
    let isMounted = true;
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          const points: LatLngExpression[] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setCoords(points);
          setDistance(route.distance / 1000);
          setDuration(route.duration / 60);
          
          // @ts-ignore
          if (map && map._loaded && map.getContainer()) {
            map.fitBounds(points as L.LatLngBoundsExpression, {
              padding: [50, 50],
            });
          }
        }
      })
      .catch((err) => {
        if (isMounted) console.error('Error carregant ruta:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [from, to, map]);

  const midpoint =
    coords.length > 0 ? coords[Math.floor(coords.length / 2)] : null;

  if (!coords.length) return null;

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
