import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

// El volum a Docker està a /app/data, que a local és back/data
const DATA_DIR = path.resolve(import.meta.dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'hidrants.db');

// Assegurem que el directori de dades existeix
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Activem el mode WAL per a millor rendiment i concurrència
sqlite.pragma('journal_mode = WAL');

// Exportem la instància de Drizzle
export const db = drizzle(sqlite, { schema });

// Exportem la instància de sqlite (per si cal accés directe mentre migrem)
export default sqlite;
