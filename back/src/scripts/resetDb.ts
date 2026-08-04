import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';
import fs from 'fs';
import path from 'path';
import sqlite, { db } from '../db/index.js';
import {
  hidrants,
  users,
  adfs,
  mqttUsers,
  incidencies,
  incidencia_events,
} from '../db/schema.js';

async function makeBackup() {
  const backupsDir = path.resolve(import.meta.dirname, '../../data/backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupsDir, `hidrants-${stamp}.db`);
  await sqlite.backup(dest);
  return dest;
}

async function run() {
  console.log('🗑️ Buident la base de dades...');

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    '⚠️  Això esborrarà TOTES les dades (hidrants, usuaris, ADFs, incidències). Escriu "RESET" per confirmar: '
  );
  rl.close();

  if (answer.trim() !== 'RESET') {
    console.log('❌ Cancel·lat. Res no s\'ha modificat.');
    process.exit(1);
  }

  try {
    const backupPath = await makeBackup();
    console.log(`💾 Còpia de seguretat creada a: ${backupPath}`);
    db.delete(incidencia_events).run();
    console.log('✅ Taula "incidencia_events" buidada.');

    db.delete(mqttUsers).run();
    console.log('✅ Taula "mqtt_users" buidada.');

    db.delete(incidencies).run();
    console.log('✅ Taula "incidencies" buidada.');

    db.delete(hidrants).run();
    console.log('✅ Taula "hidrants" buidada.');

    db.delete(users).run();
    console.log('✅ Taula "users" buidada.');

    db.delete(adfs).run();
    console.log('✅ Taula "adfs" buidada.');

    console.log('✨ Base de dades buidada correctament.');
  } catch (error) {
    console.error('❌ Error buident la base de dades:', error);
    process.exit(1);
  }
}

await run();
