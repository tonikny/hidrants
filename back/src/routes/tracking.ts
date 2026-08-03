// Rutes de tracking OwnTracks: activar/descarregar config, estat i posicions.
import { randomBytes } from 'node:crypto';
import { db } from '../db/index.js';
import { mqttUsers, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { ApiHandler } from '../types.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { isAvailable, createMqttUser, getPositions } from '../services/mqtt.js';
import { config } from '../config.js';

/** Retorna si el servei MQTT està disponible i si l'usuari té OwnTracks activat. */
const status: ApiHandler = async (req, res) => {
  const mqttRow = db.select().from(mqttUsers).where(
    and(eq(mqttUsers.user_id, req.user!.id), eq(mqttUsers.enabled, true))
  ).get();
  return res.json({ available: isAvailable(), enabled: !!mqttRow });
};

/** Retorna les posicions filtrades per ADF (admin veu tot, editor veu només la seva ADF). */
const positions: ApiHandler = async (req, res) => {
  const all = getPositions();
  const userRole = req.user!.role;
  const userAdf = req.user!.adf_id;

  let allowedUsernames: Set<string> | null = null;
  if (userRole !== 'admin') {
    if (userAdf == null) return res.json({ positions: {} });
    const sameAdf = db.select({ username: users.username }).from(users).where(eq(users.adf_id, userAdf)).all();
    allowedUsernames = new Set(sameAdf.map(u => u.username));
  }

  const obj: Record<string, any> = {};
  for (const [username, pos] of all) {
    if (!allowedUsernames || allowedUsernames.has(username)) obj[username] = pos;
  }
  return res.json({ positions: obj });
};

/** Activa OwnTracks per l'usuari actual: crea l'usuari MQTT, guarda la password xifrada, retorna .otrc. */
const enable: ApiHandler = async (req, res) => {
  const userId = req.user!.id;
  const username = req.user!.username;
  const existing = db.select().from(mqttUsers).where(eq(mqttUsers.user_id, userId)).get();
  const password = randomBytes(16).toString('hex');

  try { await createMqttUser(username, password); }
  catch (err: any) { return res.status(503).json({ error: `MQTT no disponible: ${err.message}` }); }

  if (existing) {
    db.update(mqttUsers).set({ mqtt_password_enc: encrypt(password), enabled: true }).where(eq(mqttUsers.id, existing.id)).run();
  } else {
    db.insert(mqttUsers).values({ id: randomBytes(16).toString('hex'), user_id: userId, mqtt_username: username, mqtt_password_enc: encrypt(password), enabled: true }).run();
  }
  return res.json(buildOtrc(username, password));
};

/** Descarrega el .otrc si OwnTracks ja està activat (desxifra la password de la DB). */
const configHandler: ApiHandler = async (req, res) => {
  const userId = req.user!.id;
  const username = req.user!.username;
  const row = db.select().from(mqttUsers).where(
    and(eq(mqttUsers.user_id, userId), eq(mqttUsers.enabled, true))
  ).get();

  if (!row || !row.mqtt_password_enc) return res.status(400).json({ error: 'OwnTracks no activat' });
  const password = decrypt(row.mqtt_password_enc);
  if (!password) return res.status(500).json({ error: 'No es pot desxifrar. Torna a activar.' });
  try { await createMqttUser(username, password); }
  catch { /* tornem la config igualment */ }
  return res.json(buildOtrc(username, password));
};

/** Genera l'objecte de configuració OwnTracks (.otrc). */
function buildOtrc(username: string, password: string) {
  return {
    _type: 'configuration', auth: true, username, password,
    host: config.OTRC_HOST, port: config.OTRC_PORT, tls: config.OTRC_TLS,
    mqttProtocolLevel: 4, clientId: username,
    pubTopicBase: `${config.MQTT_TOPIC_PREFIX}/${username}`,
    cmd: true, monitoring: 1, locatorDisplacement: 50, locatorInterval: 60,
  };
}

export default { status, positions, enable, config: configHandler };