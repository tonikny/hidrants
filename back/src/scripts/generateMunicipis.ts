import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import slugify from 'slug';
import { MUNICIPIS_NOMS } from './municipis.js';

dotenv.config();

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

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
    }
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
      element.bounds.maxlon
    ],
    center: [
      (element.bounds.minlat + element.bounds.maxlat) / 2,
      (element.bounds.minlon + element.bounds.maxlon) / 2
    ]
  };
}

async function run() {
  const catalog = [];
  const outDir = path.resolve(import.meta.dirname, '../../data');
  const outFile = path.join(outDir, 'municipis_catalog.json');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`🚀 Iniciant generació de catàleg per ${MUNICIPIS_NOMS.length} municipis...`);

  for (const name of MUNICIPIS_NOMS) {
    console.log(`🔍 Buscant: ${name}...`);
    try {
      const data = await fetchMunicipiData(name);
      if (data) {
        catalog.push(data);
        console.log(`✅ Trobat: ${data.name} (${data.osmRelation})`);
      }
    } catch (error) {
      console.error(`❌ Error buscant ${name}:`, error);
    }
    // Petit retard per no saturar l'API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  fs.writeFileSync(outFile, JSON.stringify(catalog, null, 2));
  console.log(`\n✨ Catàleg generat correctament a: ${outFile}`);
}

run().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
