import fs from 'fs';
import path from 'path';
import { MUNICIPIS } from './municipis';

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
  //   const outDir = path.join(process.cwd(), 'data/municipis');
  const root = path.resolve(import.meta.dirname, '../..');
  const outDir = path.join(root, 'front/public/municipis');

  fs.mkdirSync(outDir, { recursive: true });

  for (const municipi of MUNICIPIS) {
    console.log(`⬇️ Updating ${municipi.slug}`);

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

    const filePath = path.join(outDir, `${municipi.slug}.geojson`);

    fs.writeFileSync(filePath, JSON.stringify(geojson));

    console.log(`✅ Saved ${municipi.slug}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
