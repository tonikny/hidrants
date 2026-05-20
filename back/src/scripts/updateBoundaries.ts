import fs from 'fs';
import path from 'path';

async function fetchMunicipi(osmRelation: string) {
  const url =
    'https://nominatim.openstreetmap.org/lookup?' +
    new URLSearchParams({
      osm_ids: osmRelation,
      format: 'jsonv2',
      polygon_geojson: '1',
    });

  const response = await fetch(url, {
    headers: {
      // Nominatim ho requereix
      'User-Agent': 'LaTevaApp/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data for ${osmRelation}`);
  }

  return data[0];
}

async function run() {
  const root = path.resolve(import.meta.dirname, '../../..');
  const catalogPath = path.join(root, 'back/data/municipis_catalog.json');
  
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ No s\'ha trobat el catàleg de municipis. Executa primer "npm run generate:municipis"');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const outDir = path.join(root, 'back/data/boundaries');

  fs.mkdirSync(outDir, { recursive: true });

  for (const municipi of catalog) {
    const filePath = path.join(outDir, `${municipi.slug}.geojson`);
    console.log(`⬇️ Updating ${municipi.slug}`);

    try {
      const result = await fetchMunicipi(municipi.osmRelation);

      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              slug: municipi.slug,
              osmRelation: municipi.osmRelation,
              name: result.display_name,
            },
            geometry: result.geojson,
          },
        ],
      };

      fs.writeFileSync(filePath, JSON.stringify(geojson));
      console.log(`✅ Saved ${municipi.slug}`);
    } catch (error) {
      console.error(`❌ Error updating ${municipi.slug}:`, error instanceof Error ? error.message : error);
      if (fs.existsSync(filePath)) {
        console.warn(`⚠️ Es manté el fitxer GeoJSON existent per a: ${municipi.slug}`);
      }
    }
    
    // Retard per respectar l'ús de Nominatim (1 segon per petició)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
