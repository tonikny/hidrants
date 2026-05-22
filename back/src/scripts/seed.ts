import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import fs from 'fs';
import path from 'path';
import slugify from 'slug';
import { MUNICIPIS_NOMS } from './municipis.js';

async function run() {
  console.log('🌱 Iniciant seed de dades...');

  const DEFAULT_PASSWORD = 'admin';
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  
  const catalogPath = path.resolve(import.meta.dirname, '../../data/municipis_catalog.json');
  let municipis = MUNICIPIS_NOMS.map(name => ({ name, slug: slugify(name) }));

  if (fs.existsSync(catalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    municipis = catalog.map((m: any) => ({ name: m.name, slug: m.slug }));
  }

  // Afegim un admin global
  const globalAdmin = { id: uuidv4(), username: 'admin', hash, municipi: 'all', role: 'admin' };
  
  try {
    // Admin global
    db.insert(users).values({
      id: uuidv4(),
      username: 'admin',
      password_hash: hash,
      municipi: 'general',
      role: 'admin'
    }).onConflictDoNothing().run();
    console.log('👤 Usuari admin global creat (admin/admin)');

    for (const m of municipis) {
      db.insert(users).values({
        id: uuidv4(),
        username: `admin_${m.slug.replace(/-/g, '_')}`,
        password_hash: hash,
        municipi: m.slug,
        role: 'admin'
      }).onConflictDoNothing().run();
      console.log(`👤 Usuari admin per a ${m.name} creat (admin_${m.slug.replace(/-/g, '_')}/admin)`);
    }

    console.log('✨ Seed completat correctament.');
  } catch (error) {
    console.error('❌ Error durant el seed:', error);
    process.exit(1);
  }
}

run();
