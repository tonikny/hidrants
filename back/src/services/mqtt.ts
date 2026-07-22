import mqtt from 'mqtt';
import { z } from 'zod';

// Configuració des de variables d'entorn
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'hidrants-back';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'owntracks/#';

// Schema de validació per a payloads d'OwnTracks
// Basat en: https://owntracks.org/booklet/tech/json/
const OwnTracksLocationSchema = z.object({
  _type: z.literal('location'),
  tid: z.string().optional(), // Tracker ID (2 caràcters)
  lat: z.number().min(-90).max(90), // Latitud
  lon: z.number().min(-180).max(180), // Longitud
  tst: z.number(), // Timestamp (Unix epoch)
  acc: z.number().optional(), // Accuracy en metres
  alt: z.number().optional(), // Altitud
  batt: z.number().min(0).max(100).optional(), // Bateria en percentatge
  vel: z.number().optional(), // Velocitat en km/h
  cog: z.number().optional(), // Course over ground (direcció)
  t: z.string().optional(), // Trigger (p=ping, u=user, t=timer, etc.)
  conn: z.string().optional(), // Tipus de connexió (w=wifi, m=mobile)
  BSSID: z.string().optional(), // WiFi BSSID
  SSID: z.string().optional(), // WiFi SSID
});

type OwnTracksLocation = z.infer<typeof OwnTracksLocationSchema>;

let client: mqtt.MqttClient | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Funció per iniciar el client MQTT de forma segura
function initMqttClient() {
  try {
    // Opcions de connexió MQTT amb manejo d'errors millorat
    const mqttOptions: mqtt.IClientOptions = {
      clientId: MQTT_CLIENT_ID,
      clean: true,
      reconnectPeriod: 10000, // Reconnectar cada 10 segons
      connectTimeout: 10000, // Timeout de connexió 10 segons
      rejectUnauthorized: false, // Per certificats autosignats en dev
    };

    console.log('[MQTT] Iniciant connexió a', MQTT_BROKER_URL);

    client = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

    setupEventHandlers();
  } catch (error) {
    console.error('[MQTT] ❌ Error fatal iniciant client MQTT:', error);
    console.log('[MQTT] ⚠️  El backend continuarà funcionant sense MQTT');
  }
}

function setupEventHandlers() {
  if (!client) return;

  // Event: Connexió establerta
  client.on('connect', () => {
    connectionAttempts = 0; // Reset counter en connexió exitosa
    console.log('[MQTT] ✅ Connectat correctament');
    console.log('[MQTT] Client ID:', MQTT_CLIENT_ID);

    if (client) {
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error(
            '[MQTT] ❌ Error subscrivint-se al topic:',
            MQTT_TOPIC,
            err
          );
        } else {
          console.log('[MQTT] 📡 Subscrit al topic:', MQTT_TOPIC);
        }
      });
    }
  });

  // Event: Missatge rebut
  client.on('message', (topic: string, payload: Buffer) => {
    try {
      // Intentar parsejar com JSON
      const payloadString = payload.toString();
      const data = JSON.parse(payloadString);

      // Validar si és un missatge de localització d'OwnTracks
      const validation = OwnTracksLocationSchema.safeParse(data);

      if (validation.success) {
        const location: OwnTracksLocation = validation.data;
        const timestamp = new Date().toISOString();
        console.log(`[MQTT] 📍 Ubicació rebuda [${timestamp}]`);
        console.log('[MQTT]   Topic:', topic);
        console.log('[MQTT]   Tracker:', location.tid || 'N/A');
        console.log('[MQTT]   Coordenades:', `${location.lat}, ${location.lon}`);
        console.log('[MQTT]   Precisió:', location.acc ? `${location.acc}m` : 'N/A');
        console.log('[MQTT]   Bateria:', location.batt !== undefined ? `${location.batt}%` : 'N/A');

        // TODO: Aquí es guardarà a la base de dades en un pas futur
        // await saveLocationToDatabase(topic, location);
      } else {
        // Només mostrar warning per a tipus desconeguts, no per a tipus coneguts com "status"
        const messageType = data._type || 'desconegut';
        if (messageType !== 'status' && messageType !== 'transition' && messageType !== 'waypoint' && messageType !== 'lwt') {
          console.log(`[MQTT] ⚠️  Missatge no processat: ${messageType} (topic: ${topic})`);
        }
      }
    } catch (error) {
      console.error('[MQTT] ❌ Error processant missatge:', error);
    }
  });

  // Event: Error de connexió
  client.on('error', (error) => {
    connectionAttempts++;
    console.error('[MQTT] ❌ Error de connexió:', error.message);

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.log(
        '[MQTT] ⚠️  Massa intents fallits de connexió. Desactivant reconnexió automàtica.'
      );
      console.log('[MQTT] ⚠️  El backend continuarà funcionant sense MQTT');
      if (client) {
        client.end(true); // Forçar tancament
      }
    }
  });

  // Event: Reconnexió
  client.on('reconnect', () => {
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(
        '[MQTT] 🔄 Intentant reconnectar... (intent ' +
          (connectionAttempts + 1) +
          '/' +
          MAX_CONNECTION_ATTEMPTS +
          ')'
      );
    }
  });

  // Event: Connexió tancada
  client.on('close', () => {
    console.log('[MQTT] 🔌 Connexió tancada');
  });

  // Event: Offline
  client.on('offline', () => {
    console.log('[MQTT] 📡 Client offline');
  });
}

// Iniciar el client MQTT de forma no-bloquejant
try {
  initMqttClient();
} catch (error) {
  console.error('[MQTT] ❌ Error crític iniciant MQTT:', error);
  console.log('[MQTT] ⚠️  El backend continuarà funcionant sense MQTT');
}

// Exportar el client per si es necessita des d'altres mòduls
export default client;
