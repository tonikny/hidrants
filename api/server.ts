import Fastify, { FastifyReply, FastifyRequest } from 'fastify';

import fs from 'fs';
import path from 'path';

import { fileURLToPath, pathToFileURL } from 'url';

import type { ApiHandler, ApiRequest, ApiResponse } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({
  logger: true,
});
app.addHook('preHandler', async (req) => {
  console.log('RAW BODY:', req.body);
});

function createRes(reply: FastifyReply): ApiResponse {
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

const routesDir = path.join(__dirname, 'routes');

const files = fs.readdirSync(routesDir).filter((file) => file.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);

  const mod = await import(pathToFileURL(filePath).href);

  const handler: ApiHandler = mod.default;

  const routePath =
    '/' +
    path.relative(routesDir, filePath).replace(/\\/g, '/').replace(/\.ts$/, '');

  app.all(routePath, async (request: FastifyRequest, reply: FastifyReply) => {
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
  });

  console.log(`Loaded route: ${routePath}`);
}

await app.listen({
  // host: '0.0.0.0',
  host: '127.0.0.1',
  port: 3033,
});
