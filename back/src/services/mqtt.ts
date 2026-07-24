import mqtt from 'mqtt';
import { z } from 'zod';
import { config } from '../config.js';
import { TrackingService } from './trackingService.js';

// Schema de validació per a payloads d'OwnTracks
const OwnTracksLocationSchema = z.object({
  _type: z.literal('location'),
  tid: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tst: z.number(),
  acc: z.number().optional(),
  alt: z.number().optional(),
  batt: z.number().min(0).max(100).optional(),
  vel: z.number().optional(),
  cog: z.number().optional(),
  t: z.string().optional(),
  conn: z.string().optional(),
});

let client: mqtt.MqttClient | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export function initMqttClient() {
  try {
    const mqttOptions: mqtt.IClientOptions = {
      clientId: config.MQTT_CLIENT_ID,
      clean: true,
      reconnectPeriod: 10000,
      connectTimeout: 10000,
      rejectUnauthorized: false,
    };

    console.log('[MQTT] Iniciant connexió a', config.MQTT_BROKER_URL);
    client = mqtt.connect(config.MQTT_BROKER_URL, mqttOptions);
    setupEventHandlers();
  } catch (error) {
    console.error('[MQTT] ❌ Error fatal iniciant client MQTT:', error);
    console.log('[MQTT] ⚠️  El backend continuarà funcionant sense MQTT');
  }
}

function setupEventHandlers() {
  if (!client) return;

  client.on('connect', () => {
    connectionAttempts = 0;
    console.log('[MQTT] ✅ Connectat correctament');

    if (client) {
      client.subscribe(config.MQTT_TOPIC, (err) => {
        if (err) {
          console.error('[MQTT] ❌ Error subscrivint-se al topic:', config.MQTT_TOPIC, err);
        } else {
          console.log('[MQTT] 📡 Subscrit al topic:', config.MQTT_TOPIC);
        }
      });
    }
  });

  client.on('message', async (topic: string, payload: Buffer) => {
    try {
      const data = JSON.parse(payload.toString());
      const validation = OwnTracksLocationSchema.safeParse(data);

      if (validation.success) {
        await TrackingService.saveLocation(topic, validation.data);
        console.log(`[MQTT] 📍 Ubicació guardada: ${topic}`);
      } else if (data._type && !['status', 'transition', 'waypoint', 'lwt'].includes(data._type)) {
        console.log(`[MQTT] ⚠️ Missatge no processat: ${data._type} (topic: ${topic})`);
      }
    } catch (error) {
      console.error('[MQTT] ❌ Error processant missatge:', error);
    }
  });

  client.on('error', (error) => {
    connectionAttempts++;
    console.error('[MQTT] ❌ Error de connexió:', error.message);

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.log('[MQTT] ⚠️ Massa intents fallits. Desactivant reconnexió.');
      if (client) client.end(true);
    }
  });

  client.on('reconnect', () => {
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`[MQTT] 🔄 Intentant reconnectar... (${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})`);
    }
  });

  client.on('close', () => console.log('[MQTT] 🔌 Connexió tancada'));
}

export default client;
