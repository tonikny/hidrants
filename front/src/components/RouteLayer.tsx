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
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          const points: LatLngExpression[] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setCoords(points);
          setDistance(route.distance / 1000);
          setDuration(route.duration / 60);
          map.fitBounds(points as L.LatLngBoundsExpression, {
            padding: [50, 50],
          });
        }
      })
      .catch((err) => console.error('Error carregant ruta:', err));
    // const url = `/api/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}`;

    // fetch(url)
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (!data.paths || !data.paths.length) return;
    //     const route = data.paths[0];
    //     const points = route.points.coordinates.map(
    //       ([lng, lat]: [number, number]) => [lat, lng]
    //     );
    //     setCoords(points);
    //     setDistance(route.distance / 1000);
    //     setDuration(route.time / 60000);
    //     map.fitBounds(points, { padding: [50, 50] });
    //   })
    //   .catch((err) => console.error('Error loading route:', err));
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
