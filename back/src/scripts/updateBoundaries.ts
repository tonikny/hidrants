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

  if (!response.ok) throw new Error(`Nominatim error ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error(`No data for ${osmRelation}`);
  return data[0];
}

async function run() {
  console.log('🌍 Iniciant actualització de boundaries a la base de dades...');

  const allAdfs = db.select().from(adfs).all();

  for (const adf of allAdfs) {
    const relations: string[] = JSON.parse(adf.osm_relations);
    console.log(`\n🔍 Processant ADF ${adf.id} (${relations.join(', ')})...`);

    try {
      let combinedGeoJson: any = null;
      let minLat = 90, minLon = 180, maxLat = -90, maxLon = -180;

      for (const rel of relations) {
        console.log(`  ⬇️ Descarregant ${rel}...`);
        const result = await fetchMunicipiBoundary(rel);
        
        // Simplement guardem el primer si n'hi ha un, o podríem fer merge amb turf si calgués
        // Per ara, suposem el cas normal de 1 relació.
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

        // Espera de seguretat per Nominatim
        await new Promise(r => setTimeout(r, 1100));
      }

      const bbox = [minLat, minLon, maxLat, maxLon];
      const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];

      db.update(adfs).set({
        bbox: JSON.stringify(bbox),
        center: JSON.stringify(center),
        boundary_geojson: JSON.stringify(combinedGeoJson)
      }).where(eq(adfs.id, adf.id)).run();

      console.log(`✅ ADF ${adf.id} actualitzada amb GeoJSON i BBox.`);
    } catch (err) {
      console.error(`❌ Error processant ADF ${adf.id}:`, err);
    }
  }

  console.log('\n✨ Actualització de boundaries finalitzada.');
}

run().catch(console.error);
