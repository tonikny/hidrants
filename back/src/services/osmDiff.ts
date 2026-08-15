/**
 * Lògica compartida de càlcul de diferències entre tags.
 *
 * - osmTags: la còpia que tenim a la BD (últim estat OSM conegut)
 * - remoteOsmTags: l'estat actual a OSM (o el que es pujarà)
 */

const COORD_THRESHOLD = 0.000001;

export interface DiffData {
  osmTags: Record<string, string>;
  remoteOsmTags: Record<string, string>;
  localLat: number;
  localLon: number;
  remoteLat: number;
  remoteLon: number;
}

/**
 * Calcula les diferències entre les dades de la BD i les d'OSM (remote).
 * Retorna una llista de strings descriptives (per Telegram / sync_error).
 */
export function computeDiffStrings(
  localLat: number,
  localLon: number,
  osmTags: Record<string, string>,
  remoteLat: number,
  remoteLon: number,
  remoteOsmTags: Record<string, string>,
): string[] {
  const diffs: string[] = [];

  if (Math.abs(localLat - remoteLat) > COORD_THRESHOLD) {
    diffs.push(`lat (local: ${localLat}, OSM: ${remoteLat})`);
  }
  if (Math.abs(localLon - remoteLon) > COORD_THRESHOLD) {
    diffs.push(`lon (local: ${localLon}, OSM: ${remoteLon})`);
  }

  const allKeys = new Set([...Object.keys(osmTags), ...Object.keys(remoteOsmTags)]);
  for (const k of allKeys) {
    const lv = osmTags[k] || "";
    const rv = remoteOsmTags[k] || "";
    if (lv !== rv) {
      diffs.push(`${k}: local="${lv}" OSM="${rv}"`);
    }
  }

  return diffs;
}

/**
 * Calcula les diferències com a objecte estructurat (per la UI del frontend).
 */
export function computeDiffData(
  localLat: number,
  localLon: number,
  osmTags: Record<string, string>,
  remoteLat: number,
  remoteLon: number,
  remoteOsmTags: Record<string, string>,
): DiffData {
  return { osmTags, remoteOsmTags, localLat, localLon, remoteLat, remoteLon };
}
