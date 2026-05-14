import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import dotenv from 'dotenv';

import overpass from './routes/overpass.js';
import sendToTelegram from './routes/sendToTelegram.js';
import route from './routes/route.js';
import { ApiHandler, ApiRequest } from './types.js';

dotenv.config();

const BASE_DOMAIN_URL = process.env.BASE_DOMAIN_URL || 'localhost';

const app = Fastify({
  logger: { level: process.env.FASTIFY_LOGLEVEL || 'info' },
});

/**
 * Adapter de resposta (manté la teva API custom)
 */
function createRes(reply: FastifyReply) {
  return {
    status(code: number) {
      reply.code(code);
      return this;
    },

    json(data: any) {
      reply.send(data);
    },

    send(data: any) {
      reply.send(data);
    },

    end() {
      reply.send();
    },

    setHeader(name: string, value: string) {
      reply.header(name, value);
    },
  };
}

/**
 * Wrapper per adaptar handlers a Fastify
 */
function wrap(handler: ApiHandler) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const req: ApiRequest = {
      method: request.method,
      query: request.query,
      body: request.body,
      headers: request.headers,
      params: request.params,
      url: request.url,
      municipi: (request as any).municipi,
    };

    const res = createRes(reply);

    try {
      await handler(req, res);
    } catch (err) {
      request.log.error(err);

      reply.code(500).send({
        error: 'Internal server error (500)',
      });
    }
  };
}

/**
 * 👇 MIDDLEWARE GLOBAL (EXTRACCIÓ SUBDOMINI)
 */
app.addHook('preHandler', async (request) => {
  const host = request.headers.host || '';

  let municipi = '';

  if (host.endsWith(BASE_DOMAIN_URL)) {
    const sub = host.replace(`.${BASE_DOMAIN_URL}`, '');

    // si no hi ha subdomini real → buit
    if (sub && sub !== host) {
      municipi = sub;
    }
  }
  (request as any).municipi = municipi;
  console.log(`👀 municipi: ${municipi}`);
});

/**
 * RUTES
 */
const routes = [
  { path: '/api/overpass', handler: overpass },
  { path: '/api/sendToTelegram', handler: sendToTelegram },
  { path: '/api/route', handler: route },
];
routes.forEach((r) => app.all(r.path, wrap(r.handler)));

/**
 * START SERVER
 */
const start = async () => {
  try {
    await app.listen({
      host: '0.0.0.0',
      port: Number(process.env.PORT || 3033),
    });

    console.log('🚀 API running');
    console.log(app.printRoutes());
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
