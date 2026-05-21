import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';

import overpass from './routes/overpass.js';
import sendToTelegram from './routes/sendToTelegram.js';
import route from './routes/route.js';
import municipi from './routes/municipi.js';
import municipisList from './routes/municipis.js';
import boundary from './routes/boundary.js';
import hidrants from './routes/hidrants.js';
import { login, me } from './routes/auth.js';

import { ApiHandler, ApiRequest } from './types.js';
import { config } from './config.js';
import { AppError } from './errors.js';

// Inicialitzem la base de dades


const BASE_DOMAIN_URL = config.BASE_DOMAIN_URL;

const app = Fastify({
  logger: { level: config.FASTIFY_LOGLEVEL },
});

app.register(fastifyJwt, {
  secret: config.JWT_SECRET,
});

app.setErrorHandler((error: any, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  
  if (error.statusCode) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  request.log.error(error);
  return reply.status(500).send({ error: 'Internal server error (500)' });
});

/**
 * Adapter de resposta (manté la teva API custom)
 */
function createRes(reply: FastifyReply, app: any) {
  return {
    status(code: number) {
      reply.code(code);
      return this;
    },

    json(data: any) {
      // Si el handler ha marcat un usuari per signar (cas del login)
      if ((this as any)._userToSign) {
        const token = app.jwt.sign((this as any)._userToSign);
        data.token = token;
      }
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
function wrap(handler: ApiHandler, options: { protected?: boolean } = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Si la ruta és protegida, mirem el token
    let user: any = undefined;
    if (options.protected) {
      try {
        await request.jwtVerify();
        user = (request as any).user;
        
        // Verifiquem que el municipi del token coincideix amb el del subdomini
        if (user.municipi !== (request as any).municipi) {
          return reply.status(401).send({ error: 'Token no vàlid per aquest municipi' });
        }
      } catch (err) {
        return reply.status(401).send({ error: 'Sessió caducada o no vàlida' });
      }
    } else {
      // Si no és protegida però hi ha token, també l'intentem llegir per saber qui és (cas del GET /me)
      try {
        await request.jwtVerify();
        user = (request as any).user;
      } catch (err) {
        // Ignorem si no hi ha token o és invàlid en rutes no protegides
      }
    }

    const req: ApiRequest = {
      method: request.method,
      query: request.query,
      body: request.body,
      headers: request.headers,
      params: request.params,
      url: request.url,
      municipi: (request as any).municipi,
      user,
    };

    const res = createRes(reply, app);

    try {
      await handler(req, res);
    } catch (err) {
      throw err; // El global error handler ho gestionarà
    }
  };
}

/**
 * MIDDLEWARE GLOBAL (EXTRACCIÓ SUBDOMINI)
 */
app.addHook('preHandler', async (request) => {
  const fullHost = request.headers.host || '';
  const host = fullHost.split(':')[0]; 

  let municipi = '';

  if (host.endsWith(BASE_DOMAIN_URL) && host !== BASE_DOMAIN_URL) {
    municipi = host.replace(`.${BASE_DOMAIN_URL}`, '');
    if (municipi.endsWith('.')) municipi = municipi.slice(0, -1);
  }

  (request as any).municipi = municipi || 'general'; // Default a 'general' si no hi ha subdomini
});

/**
 * RUTES
 */
const routes = [
  { path: '/api/auth/login', handler: login },
  { path: '/api/auth/me', handler: me },
  { path: '/api/overpass', handler: overpass },
  { path: '/api/hidrants/sync', handler: hidrants, protected: true },
  { path: '/api/hidrants', handler: hidrants },
  { path: '/api/hidrants/:id', handler: hidrants },
  { path: '/api/sendToTelegram', handler: sendToTelegram },
  { path: '/api/route', handler: route },
  { path: '/api/municipi', handler: municipi },
  { path: '/api/municipis', handler: municipisList },
  { path: '/api/municipi/boundary', handler: boundary },
];

routes.forEach((r) => {
  // Les mutacions d'hidrants sempre protegides
  const isMutation = (r.path.includes('/hidrants') && r.handler === hidrants);
  
  app.all(r.path, async (request, reply) => {
    // Per a hidrants, mirem si el mètode és de mutació
    const needsAuth = r.protected || (isMutation && ['POST', 'PUT', 'DELETE'].includes(request.method));
    return wrap(r.handler, { protected: needsAuth })(request, reply);
  });
});

/**
 * START SERVER
 */
const start = async () => {
  try {
    await app.listen({
      host: '0.0.0.0',
      port: config.PORT,
    });

    console.log('🚀 API running');
    console.log(app.printRoutes());
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
