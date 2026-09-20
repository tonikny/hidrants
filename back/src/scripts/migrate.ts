import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import sqlite, { db } from '../db/index.js';
import path from 'path';
import { logger } from '../utils/logger.js';

const log = logger.child({ module: 'db', operation: 'migrate' });

async function runMigrations() {
  log.info('🔄 Executant migracions de la base de dades...');
  try {
    const migrationsFolder = path.resolve(import.meta.dirname, '../../drizzle');

    migrate(db, { migrationsFolder });
    log.info('✅ Migracions completades amb èxit.');
  } catch (error) {
    log.error({ error }, '❌ Error executant migracions');
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

await runMigrations();
