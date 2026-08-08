// Neteja d'identitats MQTT obsoletes (OwnTracks/DynSec):
// - Alinea mqtt_users.mqtt_username amb el nom d'usuari actual (post-renaming a XXX/YYY o XXX/GI/YYY).
// - Esborra clients DynSec orfes (rol owntracks-device) sense usuari corresponent.
// Ús: tsx src/scripts/cleanupMqtt.ts [--apply]   (sense --apply només informa)
import type { MqttClient } from 'mqtt';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { users, mqttUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { decrypt } from '../utils/crypto.js';
import { dynsecConnect, dynsecCommand } from '../services/dynsec.js';
import { mqttNameFor } from '../services/mqtt.js';

const APPLY = process.argv.includes('--apply');
const SISTEMA = new Set(['admin', config.MQTT_BACKEND_USERNAME]);

interface DyResp { responses?: { data?: { totalCount?: number; clients?: string[] } }[] }

/** Connecta com a admin DynSec i executa una operació. Retorna null si el broker no és accessible. */
async function withAdmin<T>(fn: (client: MqttClient) => Promise<T>): Promise<T | null> {
  try {
    const client = await dynsecConnect(config.MQTT_ADMIN_USERNAME, config.MQTT_ADMIN_PASSWORD);
    try { return await fn(client); } finally { client.end(true); }
  } catch (err) {
    console.log(`Missatge del broker MQTT no accessible (${err instanceof Error ? err.message : String(err)}):`);
    console.log('  només es normalitzarà la base de dades; els canvis DynSec caldrà fer-los amb el broker actiu.');
    return null;
  }
}

/** Retorna els NOMENENTS de tots els clients DynSec. */
async function listClients(client: MqttClient): Promise<string[]> {
  const out: string[] = [];
  const count = 100;
  for (let offset = 0; offset < 100000; offset += count) {
    const resp = (await dynsecCommand(client, { command: 'listClients', count, offset })) as DyResp;
    const clients = resp?.responses?.[0]?.data?.clients ?? [];
    for (const c of clients) {
      out.push(c);
    }
    if (clients.length < count) {break;}
  }
  return out;
}

async function run() {
  console.log(`🧹 Neteja d'identitats MQTT (mode: ${APPLY ? 'APLICAR' : 'DRY-RUN'})`);
  console.log('----------------------------------------');

  // 1) Alinear mqtt_users.mqtt_username amb la identitat MQTT aplanada (sers).
  const rows = db
    .select({
      rowId: mqttUsers.id,
      username: mqttUsers.mqtt_username,
      current: users.username,
      enc: mqttUsers.mqtt_password_enc,
    })
    .from(mqttUsers)
    .innerJoin(users, eq(mqttUsers.user_id, users.id))
    .all();

  let fixedDb = 0;
  let dynOps = 0;
  for (const r of rows) {
    const mqName = mqttNameFor(r.current);
    if (r.username === mqName) {continue;}
    console.log(`  Usuari ${r.current}: mqtt_username "${r.username}" → "${mqName}"`);
    fixedDb++;

    // Operació DynSec (best-effort, només amb broker disponible)
    const password = r.enc ? decrypt(r.enc) : null;
    const ops = await withAdmin(async (client) => {
      let n = 0;
      if (password) {
        try {
          await dynsecCommand(client, {
            command: 'createClient', username: mqName, password, roles: [{ rolename: 'owntracks-device' }],
          });
          n++;
        } catch {
          try {
            await dynsecCommand(client, { command: 'setClientPassword', username: mqName, password });
            n++;
          } catch { /* ja existeix amb la mateixa password */ }
        }
      }
      try {
        await dynsecCommand(client, { command: 'deleteClient', username: r.username });
        n++;
      } catch { /* el client antic no existeix a DynSec */ }
      return n;
    });
    dynOps += ops ?? 0;

    if (APPLY) {
      db.update(mqttUsers).set({ mqtt_username: mqName }).where(eq(mqttUsers.id, r.rowId)).run();
    }
  }
  console.log(`  ${fixedDb} registres desalineats (${APPLY ? "aplicat" : "pendent d'aplicar"}), ${dynOps} operacions DynSec.`);

  // 2. Elimina clients DynSec obsolets que no corresponguin a cap usuari actual
  if (APPLY) {
    // "kept": totes les identitats MQTT aplanades dels usuaris + les emmagatzemades a mqtt_users
    const kept = new Set(db.select({ username: users.username }).from(users).all().map((r) => mqttNameFor(r.username)));
    for (const r of db.select({ username: mqttUsers.mqtt_username }).from(mqttUsers).all()) {
      kept.add(r.username);
    }

    const clients = await withAdmin((client) => listClients(client));
    if (clients === null) {
      console.log("  ⚠️ No s'ha pogut inspeccionar DynSec (broker no accessible).");
    } else {
      const orphans = clients.filter(
        (u) => !kept.has(u) && !SISTEMA.has(u),
      );
      for (const o of orphans) {
        console.log(`  Client orfe DynSec a eliminar: ${o}`);
        await withAdmin(async (client) => {
          await dynsecCommand(client, { command: 'deleteClient', username: o });
        });
      }
      if (orphans.length === 0) {
        console.log('  Cap client orfe detectat.');
      }
    }
  } else {
    console.log('  (executa amb --apply per eliminar clients orfés i aplicar els canvis)');
  }

  console.log('✅ Neteja finalitzada.');
}

await run();