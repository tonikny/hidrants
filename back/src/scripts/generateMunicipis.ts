import fs from 'fs';
import path from 'path';
import slugify from 'slug';
import { MUNICIPIS_NOMS } from './municipis.js';
import { config } from '../config.js';

const OVERPASS_URL = config.OVERPASS_URL;

// ID de la relació de Catalunya (349053) + 3600000000 per a l'àrea d'Overpass
const CATALUNYA_AREA_ID = '3600349053';

async function fetchMunicipiData(name: string) {
  const query = `
    [out:json][timeout:25];
    area(${CATALUNYA_AREA_ID})->.searchArea;
    relation["boundary"="administrative"]["admin_level"="8"]["name"="${name}"](area.searchArea);
    out bb;
  `;

  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HidrantsApp/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.elements || data.elements.length === 0) {
    console.warn(`⚠️ No s'ha trobat dades per al municipi: ${name}`);
    return null;
  }

  // Agafem el primer resultat
  const element = data.elements[0];

  return {
    name: element.tags.name || name,
    slug: slugify(name),
    osmRelation: `R${element.id}`,
    bbox: [
      element.bounds.minlat,
      element.bounds.minlon,
      element.bounds.maxlat,
      element.bounds.maxlon,
    ],
    center: [
      (element.bounds.minlat + element.bounds.maxlat) / 2,
      (element.bounds.minlon + element.bounds.maxlon) / 2,
    ],
  };
}

async function run() {
  const outDir = path.resolve(import.meta.dirname, '../../data');
  const outFile = path.join(outDir, 'municipis_catalog.json');

  // Llegim el catàleg existent si existeix
  let existingCatalog: any[] = [];
  if (fs.existsSync(outFile)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    } catch (e) {
      console.warn(
        "⚠️ No s'ha pogut llegir el catàleg existent, es començarà de zero."
      );
    }
  }

  const catalog = [];

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(
    `🚀 Iniciant generació de catàleg per ${MUNICIPIS_NOMS.length} municipis...`
  );

  for (const name of MUNICIPIS_NOMS) {
    console.log(`🔍 Buscant: ${name}...`);
    try {
      const data = await fetchMunicipiData(name);
      if (data) {
        catalog.push(data);
        console.log(`✅ Trobat: ${data.name} (${data.osmRelation})`);
      } else {
        // Si no es troba però el teníem al catàleg vell, el mantenim
        const oldData = existingCatalog.find(
          (m) => m.name === name || m.slug === slugify(name)
        );
        if (oldData) {
          catalog.push(oldData);
          console.warn(
            `⚠️ No s'ha trobat a Overpass, es manté valor antic per a: ${name}`
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Error buscant ${name}:`,
        error instanceof Error ? error.message : error
      );

      // En cas d'error (p.ex. 429), busquem si el teníem al catàleg vell per no perdre'l
      const oldData = existingCatalog.find(
        (m) => m.name === name || m.slug === slugify(name)
      );
      if (oldData) {
        catalog.push(oldData);
        console.warn(
          `⚠️ S'ha produït un error, es manté valor antic per a: ${name}`
        );
      }
    }
    // Augmentem el retard per no saturar l'API d'Overpass (2 segons)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  fs.writeFileSync(outFile, JSON.stringify(catalog, null, 2));
  console.log(`\n✨ Catàleg generat correctament a: ${outFile}`);
}

run().catch((err) => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
