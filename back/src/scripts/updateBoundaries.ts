import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const log = logger.child({ module: 'adf', operation: 'update_boundaries' });

async function fetchMunicipiBoundary(osmRelation: string) {
  // Use Nominatim or similar
  const url = 'https://nominatim.openstreetmap.org/lookup?' + 
    new URLSearchParams({
      osm_ids: osmRelation,
      format: 'jsonv2',
      polygon_geojson: '1',
    });

  const response = await fetch(url, {
    headers: { 'User-Agent': 'HidrantsApp/1.0' },
  });

  if (!response.ok) {throw new Error(`Nominatim error ${response.status}`);}
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {throw new Error(`No data for ${osmRelation}`);}
  return data[0];
}

async function run() {
  const adfIdArg = process.argv[2];
  let allAdfs;

  if (adfIdArg) {
    const adfId = parseInt(adfIdArg);
    allAdfs = db.select().from(adfs).where(eq(adfs.id, adfId)).all();
    if (allAdfs.length === 0) {
       log.error({ adfId }, '❌ ADF no trobada');
       process.exit(1);
     }
     log.info({ adf_nom: allAdfs[0].nom }, '🌍 Iniciant actualització de boundaries per a aquesta ADF');
   } else {
     allAdfs = db.select().from(adfs).all();
     log.info('🌍 Iniciant actualització de boundaries a la base de dades...');
  }

  for (const adf of allAdfs) {
    const relations: string[] = JSON.parse(adf.osm_relations);
    log.info({ adf_id: adf.id, adf_nom: adf.nom, relations: relations.join(', ') }, '🔍 Processant ADF');

    try {
      let combinedGeoJson: unknown = null;
      let minLat = 90, minLon = 180, maxLat = -90, maxLon = -180;
      let successCount = 0;

      for (const rel of relations) {
        try {
          log.info({ relation: rel }, '  ⬇️ Descarregant');
          const result = await fetchMunicipiBoundary(rel);
          
          if (!combinedGeoJson) {
            combinedGeoJson = {
              type: 'Feature',
              properties: { adf_id: adf.id, name: adf.nom },
              geometry: result.geojson
            };
          }

          // Update bbox
          const b = result.boundingbox; // [minlat, maxlat, minlon, maxlon]
          minLat = Math.min(minLat, parseFloat(b[0]));
          maxLat = Math.max(maxLat, parseFloat(b[1]));
          minLon = Math.min(minLon, parseFloat(b[2]));
          maxLon = Math.max(maxLon, parseFloat(b[3]));
          
          successCount++;
        } catch (relErr) {
          log.error({ error: relErr instanceof Error ? relErr.message : relErr, relation: rel }, '⚠️ Error descarregant relació');
        }

        // Espera de seguretat per Nominatim
        await new Promise(r => setTimeout(r, 1100));
      }

      // NOMÉS actualitzem si hem pogut baixar TOTES les relacions
      if (relations.length > 0 && successCount === relations.length) {
        const bbox = [minLat, minLon, maxLat, maxLon];
        const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];

        db.update(adfs).set({
          bbox: JSON.stringify(bbox),
          center: JSON.stringify(center),
          boundary_geojson: JSON.stringify(combinedGeoJson)
        }).where(eq(adfs.id, adf.id)).run();

        log.info({ adf_id: adf.id }, '✅ ADF actualitzada amb GeoJSON i BBox');
       } else {
          log.warn({ adf_id: adf.id, successCount, relationsCount: relations.length }, '⚠️ ADF saltada per errors parcials');
       }
     } catch (err) {
       log.error({ error: err, adf_id: adf.id }, '❌ Error inesperat processant ADF');
    }
  }

  log.info('\n✨ Actualització de boundaries finalitzada.');
}

await run();
