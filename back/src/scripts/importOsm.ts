import { syncAdfFromOSM } from '../services/osmSync.js';
import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    console.log(`🚀 Iniciant importació d'hidrants des d'OSM NOMÉS per a l'ADF ${allAdfs[0].nom}...`);
  } else {
    allAdfs = db.select().from(adfs).all();
    console.log(`🚀 Iniciant importació d'hidrants des d'OSM per a ${allAdfs.length} ADFs...`);
  }

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

await run();
