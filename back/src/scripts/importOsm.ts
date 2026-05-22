import { syncAdfFromOSM } from '../services/osmSync.js';
import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';

async function run() {
  const allAdfs = db.select().from(adfs).all();
  
  console.log(`🚀 Iniciant importació d'hidrants des d'OSM per a ${allAdfs.length} ADFs...`);

  for (const adf of allAdfs) {
    try {
      console.log(`\n🔍 Processant ADF ${adf.id} (${adf.nom})...`);
      const count = await syncAdfFromOSM(adf.id);
      console.log(`✅ Sincronitzats ${count} hidrants per a ${adf.nom}`);
    } catch (error) {
      console.error(`❌ Error sincronitzant ${adf.nom}:`, error instanceof Error ? error.message : error);
    }
    
    // Esperem una mica entre ADFs per no saturar Overpass
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✨ Importació des d\'OSM finalitzada.');
}

run().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
