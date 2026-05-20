import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// El volum a Docker està a /app/data, que a local és back/data
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'hidrants.db');

// Assegurem que el directori de dades existeix
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Activem el mode WAL per a millor rendiment i concurrència
db.pragma('journal_mode = WAL');

/**
 * Inicialitza l'esquema de la base de dades
 */
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hidrants (
      id TEXT PRIMARY KEY,
      osm_id INTEGER,
      municipi TEXT,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      osm_tags TEXT DEFAULT '{}',
      private_tags TEXT DEFAULT '{}',
      sync_status TEXT CHECK(sync_status IN ('SYNCED', 'PENDING_CREATE', 'PENDING_UPDATE', 'PENDING_DELETE')) DEFAULT 'SYNCED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_hidrants_municipi ON hidrants(municipi);
    CREATE INDEX IF NOT EXISTS idx_hidrants_osm_id ON hidrants(osm_id);
    CREATE INDEX IF NOT EXISTS idx_hidrants_sync_status ON hidrants(sync_status);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      municipi TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'editor')) DEFAULT 'editor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username, municipi)
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_municipi ON users(municipi);
  `);
  
  console.log('✅ Base de dades SQLite inicialitzada correctament');
}

export default db;
