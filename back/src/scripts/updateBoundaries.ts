import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
      console.error(`❌ ADF amb ID ${adfId} no trobada.`);
      process.exit(1);
    }
    console.log(`🌍 Iniciant actualització de boundaries NOMÉS per a l'ADF ${allAdfs[0].nom}...`);
  } else {
    allAdfs = db.select().from(adfs).all();
    console.log('🌍 Iniciant actualització de boundaries a la base de dades...');
  }

  for (const adf of allAdfs) {
    const relations: string[] = JSON.parse(adf.osm_relations);
    console.log(`\n🔍 Processant ADF ${adf.id} (${relations.join(', ')})...`);

    try {
      let combinedGeoJson: unknown = null;
      let minLat = 90, minLon = 180, maxLat = -90, maxLon = -180;
      let successCount = 0;

      for (const rel of relations) {
        try {
          console.log(`  ⬇️ Descarregant ${rel}...`);
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
          console.error(`  ⚠️ Error descarregant relació ${rel}:`, relErr instanceof Error ? relErr.message : relErr);
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

        console.log(`✅ ADF ${adf.id} actualitzada amb GeoJSON i BBox.`);
      } else {
        console.warn(`⚠️ ADF ${adf.id} saltada per errors parcials (${successCount}/${relations.length} relacions). Es mantenen les dades actuals.`);
      }
    } catch (err) {
      console.error(`❌ Error inesperat processant ADF ${adf.id}:`, err);
    }
  }

  console.log('\n✨ Actualització de boundaries finalitzada.');
}

await run();
