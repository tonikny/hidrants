import { syncMunicipiFromOSM } from '../services/osmSync.js';
import fs from 'fs';
import path from 'path';

async function run() {
  const catalogPath = path.resolve(import.meta.dirname, '../../data/municipis_catalog.json');
  
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ No s\'ha trobat el catàleg de municipis. Executa primer "npm run generate:municipis"');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  
  console.log(`🚀 Iniciant importació d'hidrants des d'OSM per a ${catalog.length} municipis...`);

  for (const municipi of catalog) {
    try {
      console.log(`\n🔍 Processant ${municipi.name} (${municipi.slug})...`);
      const count = await syncMunicipiFromOSM(municipi.slug);
      console.log(`✅ Sincronitzats ${count} hidrants per a ${municipi.name}`);
    } catch (error) {
      console.error(`❌ Error sincronitzant ${municipi.name}:`, error instanceof Error ? error.message : error);
    }
    
    // Esperem una mica entre municipis per no saturar Overpass
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✨ Importació des d\'OSM finalitzada.');
}

run().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
