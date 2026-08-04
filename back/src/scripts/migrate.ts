import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import sqlite, { db } from '../db/index.js';
import path from 'path';

async function runMigrations() {
  console.log('🔄 Executant migracions de la base de dades...');
  try {
    const migrationsFolder = path.resolve(import.meta.dirname, '../../drizzle');

    migrate(db, { migrationsFolder });
    console.log('✅ Migracions completades amb èxit.');
  } catch (error) {
    console.error('❌ Error executant migracions:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

await runMigrations();
