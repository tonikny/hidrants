import { z } from 'zod';
import dotenv from 'dotenv';

// Carreguem l'entorn abans de validar (pot no ser necessari si ja es fa al main, però assegura que .env es llegeix)
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
});

// Avaluem process.env contra el schema
const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Error en la configuració de les variables d'entorn:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
