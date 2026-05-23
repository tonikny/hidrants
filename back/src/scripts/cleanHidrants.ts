import { db } from '../db/index.js';
import { hidrants } from '../db/schema.js';

async function run() {
  console.log('🗑️ Buident la taula d\'hidrants (perdent tots els canvis locals)...');
  
  try {
    db.delete(hidrants).run();
    console.log('✅ Tots els hidrants han estat eliminats.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();
