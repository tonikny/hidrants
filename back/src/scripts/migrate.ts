import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import sqlite, { db } from '../db/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Executant migracions de la base de dades...');
  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');

    migrate(db, { migrationsFolder });
    console.log('✅ Migracions completades amb èxit.');
  } catch (error) {
    console.error('❌ Error executant migracions:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

runMigrations();
