import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, adfs } from '../db/schema.js';

// Catàleg d'ADFs basat en la llista anterior de municipis
// En aquest cas, cada municipi té la seva pròpia ADF per defecte
const ADFS_INICIALS = [
  { id: 278, nom: 'ADF els Hostalets de Pierola', relations: ['R345695'] },
  { id: 266, nom: 'ADF Piera', relations: ['R345699'] },
  { id: 256, nom: 'ADF Masquefa', relations: ['R340791'] },
  { id: 279, nom: "ADF Vallbona d'Anoia", relations: ['R341896'] },
  { id: 202, nom: 'ADF la Torre de Claramunt', relations: ['R343659'] },
];

async function run() {
  console.log('🌱 Iniciant seed de dades (ADF i Usuaris)...');

  const DEFAULT_PASSWORD = 'anoia';
  const USER_PREFIX = 'adf';
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  try {
    // 1. Inserir ADFs
    for (const adfData of ADFS_INICIALS) {
      db.insert(adfs)
        .values({
          id: adfData.id,
          nom: adfData.nom,
          osm_relations: JSON.stringify(adfData.relations),
        })
        .onConflictDoNothing()
        .run();
      console.log(`✅ ADF ${adfData.id} - ${adfData.nom} creada.`);
    }

    // 2. Inserir admin global (no lligat a cap ADF per defecte, o podem triar-ne una)
    db.insert(users)
      .values({
        id: uuidv4(),
        username: 'admin',
        password_hash: hash,
        adf_id: null, // Admin global
        role: 'admin',
      })
      .onConflictDoNothing()
      .run();
    console.log('👤 Usuari admin global creat (admin/admin)');

    // 3. Inserir editors per a cada ADF
    for (const adfData of ADFS_INICIALS) {
      db.insert(users)
        .values({
          id: uuidv4(),
          username: `adf${adfData.id}`,
          password_hash: hash,
          adf_id: adfData.id,
          role: 'editor',
        })
        .onConflictDoNothing()
        .run();
      console.log(
        `👤 Usuari editor per a ${adfData.nom} creat (${USER_PREFIX}${adfData.id}/${DEFAULT_PASSWORD})`
      );
    }

    console.log('✨ Seed completat correctament.');
  } catch (error) {
    console.error('❌ Error durant el seed:', error);
    process.exit(1);
  }
}

await run();
