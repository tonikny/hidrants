// Distancia màxima que es pot arrossegar un hidrant respecte a la seva posició
// original. MANTENIR SINCRONITZAT amb front/src/utils/geo.ts (MAX_HYDRANT_MOVE_METERS).
export const MAX_HYDRANT_MOVE_METERS = 50;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function clampToMaxDistance(
  origLat: number,
  origLon: number,
  targetLat: number,
  targetLon: number,
  maxMeters: number,
): { lat: number; lon: number } {
  const dist = haversineMeters(origLat, origLon, targetLat, targetLon);
  if (dist <= maxMeters) {return { lat: targetLat, lon: targetLon };}
  const ratio = maxMeters / dist;
  return {
    lat: origLat + (targetLat - origLat) * ratio,
    lon: origLon + (targetLon - origLon) * ratio,
  };
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
  const geom = JSON.parse(boundaryGeojson).geometry;
  if (geom.type === 'Polygon') {return pointInRing(lat, lon, geom.coordinates[0]);}
  if (geom.type === 'MultiPolygon') {return geom.coordinates.some((p: number[][][]) => pointInRing(lat, lon, p[0]));}
  return true;
}