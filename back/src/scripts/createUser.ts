import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, adfs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const username = process.argv[2];
const password = process.argv[3];
const role = (process.argv[4] || 'admin') as 'admin' | 'coordinador' | 'voluntari';
const adfIdArg = process.argv[5] ? Number(process.argv[5]) : null;

const ROLES = ['admin', 'coordinador', 'voluntari'];
const USERNAME_RE = /^(\d{3})\/(GI\/)?(\d{3})$/;

if (!username || !password) {
  console.log('Ús: npm run create:user <usuari> <contrasenya> [rol] [adf_id]');
  console.log('Roles: admin, coordinador, voluntari (default admin)');
  console.log('Usuari no-admin: format XXX/YYY o XXX/GI/YYY (3 dígits, XXX = id ADF)');
  process.exit(1);
}

if (!ROLES.includes(role)) {
  console.error(`❌ Rol invàlid: ${role} (vàlids: ${ROLES.join(', ')})`);
  process.exit(1);
}

// Deriva l'ADF del nom d'usuari quan aplica
let adf_id: number | null = null;
const m = USERNAME_RE.exec(username);
if (role !== 'admin') {
  if (!m) {
    console.error('❌ El nom d\'usuari no-admin ha de tenir format XXX/YYY o XXX/GI/YYY');
    process.exit(1);
  }
  adf_id = Number(m[1]);
}
if (m) {
  adf_id = Number(m[1]);
} else if (adfIdArg !== null) {
  adf_id = adfIdArg;
}

if (adf_id !== null) {
  const adf = db.select({ id: adfs.id }).from(adfs).where(eq(adfs.id, adf_id)).get();
  if (!adf) {
    console.error(`❌ ADF ${adf_id} no existeix a la base de dades`);
    process.exit(1);
  }
}

const id = uuidv4();
const hash = bcrypt.hashSync(password, 10);

try {
  db.insert(users).values({ id, username, password_hash: hash, adf_id, role }).run();
  console.log(`✅ Usuari creat: ${username} (rol: ${role}, ADF: ${adf_id ?? 'Global'})`);
} catch (err) {
  console.error('❌ Error creant usuari:', (err as Error).message);
}