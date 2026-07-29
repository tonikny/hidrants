import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const username = process.argv[2];
const password = process.argv[3];
const adf_id = process.argv[4] ? Number(process.argv[4]) : null;

if (!username || !password) {
  console.log('Ús: npm run create:user <usuari> <contrasenya> [adf_id]');
  process.exit(1);
}

const id = uuidv4();
const hash = bcrypt.hashSync(password, 10);

try {
  db.insert(users).values({
    id,
    username,
    password_hash: hash,
    adf_id,
    role: 'admin'
  }).run();
  console.log(`✅ Usuari creat: ${username} (ADF: ${adf_id || 'Global'})`);
} catch (err) {
  console.error('❌ Error creant usuari:', (err as Error).message);
}
