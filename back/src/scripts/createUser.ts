import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const username = process.argv[2];
const password = process.argv[3];
const municipi = process.argv[4] || 'general';

if (!username || !password) {
  console.log('Ús: npm run create:user <usuari> <contrasenya> [municipi]');
  process.exit(1);
}

const id = uuidv4();
const hash = bcrypt.hashSync(password, 10);

try {
  db.insert(users).values({
    id,
    username,
    password_hash: hash,
    municipi,
    role: 'admin'
  }).run();
  console.log(`✅ Usuari creat: ${username} (${municipi})`);
} catch (err) {
  console.error('❌ Error creant usuari:', (err as Error).message);
}
