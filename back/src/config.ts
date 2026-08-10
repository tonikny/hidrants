import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  BASE_DOMAIN_URL: z.string().default('localhost'),
  PORT: z.coerce.number().default(3033),
  OVERPASS_URL: z.string().default('https://overpass-api.de/api/interpreter'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  GRAPHHOPPER_API_KEY: z.string().optional(),
  FASTIFY_LOGLEVEL: z.string().default('info'),
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET és obligatori')
    .default('canvia_aixo_per_una_clau_segura'),

  ENCRYPTION_SECRET: z
    .string()
    .min(1, 'ENCRYPTION_SECRET és obligatori')
    .default('canvia_aixo_per_una_clau_de_xifrat'),

  MQTT_BROKER_URL: z.string().default('mqtt://mosquitto:1883'),
  MQTT_ADMIN_USERNAME: z.string().default('admin'),
  MQTT_ADMIN_PASSWORD: z.string().min(1, 'MQTT_ADMIN_PASSWORD requerit'),
  MQTT_BACKEND_USERNAME: z.string().default('backend'),
  MQTT_BACKEND_PASSWORD: z.string().min(1, 'MQTT_BACKEND_PASSWORD requerit'),
  MQTT_TOPIC_PREFIX: z.string().default('owntracks/hidrants'),

  OTRC_HOST: z.string().default('hidrants.hopto.org'),
  OTRC_PORT: z.coerce.number().default(51823),
  OTRC_TLS: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),

  // URL pública https on Telegram arribi al webhook. Necessari en dev local
  // (túnel com cloudflared/ngrok) o per forçar un domini concret. En producció
  // es deriva automàticament del Host de la petició.
  WEBHOOK_PUBLIC_URL: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Error en la configuració de les variables d'entorn:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;