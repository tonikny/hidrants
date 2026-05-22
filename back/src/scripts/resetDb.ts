import { db } from '../db/index.js';
import { hidrants, users } from '../db/schema.js';

async function run() {
  console.log('🗑️ Buident la base de dades...');
  
  try {
    db.delete(hidrants).run();
    console.log('✅ Taula "hidrants" buidada.');
    
    db.delete(users).run();
    console.log('✅ Taula "users" buidada.');
    
    console.log('✨ Base de dades buidada correctament.');
  } catch (error) {
    console.error('❌ Error buident la base de dades:', error);
    process.exit(1);
  }
}

run();
