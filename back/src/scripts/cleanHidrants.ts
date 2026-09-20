import { db } from '../db/index.js';
import { hidrants } from '../db/schema.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ module: 'db', operation: 'clean_hidrants' });

async function run() {
  log.info('🗑️ Buidant la taula d\'hidrants (perdent tots els canvis locals)...');
  
  try {
    db.delete(hidrants).run();
    log.info('✅ Tots els hidrants han estat eliminats.');
  } catch (error) {
    log.error({ error }, '❌ Error:');
    process.exit(1);
  }
}

await run();
