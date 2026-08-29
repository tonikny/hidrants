import L from 'leaflet';

// Distancia màxima que es pot arrossegar un hidrant respecte a la seva posició
// original. MANTENIR SINCRONITZAT amb back/src/utils/geo.ts (MAX_HYDRANT_MOVE_METERS).
export const MAX_HYDRANT_MOVE_METERS = 50;

export function clampToMaxDistance(original: L.LatLng, target: L.LatLng, maxMeters: number): L.LatLng {
  const dist = original.distanceTo(target);
  if (dist <= maxMeters) {return target;}
  const ratio = maxMeters / dist;
  return L.latLng(
    original.lat + (target.lat - original.lat) * ratio,
    original.lng + (target.lng - original.lng) * ratio,
  );
}

function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      {inside = !inside;}
  }
  return inside;
}

export function isPointInBoundary(lat: number, lon: number, boundaryGeojson: string | null): boolean {
  if (!boundaryGeojson) {return true;}
  try {
    const geom = JSON.parse(boundaryGeojson).geometry;
    if (geom.type === 'Polygon') {return pointInRing(lat, lon, geom.coordinates[0]);}
    if (geom.type === 'MultiPolygon') {return geom.coordinates.some((p: number[][][]) => pointInRing(lat, lon, p[0]));}
  } catch { /* ignore parse errors */ }
  return true;
}