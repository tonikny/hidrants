import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import dotenv from 'dotenv';

import overpass from './routes/overpass.js';
import sendToTelegram from './routes/sendToTelegram.js';
import route from './routes/route.js';
import { ApiHandler, ApiRequest } from './types.js';

dotenv.config();

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

// /**
//  * Tipus API
//  */
// type ApiRequest = {
//   method: string;
//   query: any;
//   body: any;
//   headers: any;
//   params: any;
//   url: string;
// };

// type ApiResponse = ReturnType<typeof createRes>;

// type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

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
