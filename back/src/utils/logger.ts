import { pino } from "pino";

export const logger = pino({
  level: process.env.FASTIFY_LOGLEVEL || "info",
});
