import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

import overpass from './routes/overpass.js';
import sendToTelegram from './routes/sendToTelegram.js';
import route from './routes/route.js';
import municipi from './routes/municipi.js';
import municipisList from './routes/municipis.js';
import boundary from './routes/boundary.js';
import hidrants from './routes/hidrants.js';
import incidencies from './routes/incidencies.js';
import tracking from './routes/tracking.js';
import { login, me, logout } from './routes/auth.js';

import { ApiHandler, ApiRequest } from './types.js';
import { config } from './config.js';
import { AppError } from './errors.js';

// Iniciar servei MQTT
import './services/mqtt.js';

const app = Fastify({
  logger: { level: config.FASTIFY_LOGLEVEL },
});

app.register(fastifyCookie);

app.register(fastifyJwt, {
  secret: config.JWT_SECRET,
  cookie: {
    cookieName: 'auth_token',
    signed: false,
  },
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
 * Adapter de resposta (simplificat, sense subdominis)
 */
function createRes(reply: FastifyReply, app: any, request: FastifyRequest) {
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

        const cookieOptions: any = {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 dies
        };

        // Si estem en producció o l'usuari accedeix per HTTPS, marquem la cookie com a segura
        if (process.env.NODE_ENV === 'production' || request.protocol === 'https' || request.headers['x-forwarded-proto'] === 'https') {
          cookieOptions.secure = true;
        }

        reply.setCookie('auth_token', token, cookieOptions);
      }

      // Si el handler ha demanat esborrar la cookie (cas del logout)
      if ((this as any)._clearCookie) {
        reply.clearCookie('auth_token', {
          path: '/',
        });
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
    let user: any = undefined;

    try {
      // DEBUG: Log cookies
      // console.log('Cookies:', request.cookies);
      
      await request.jwtVerify();
      user = (request as any).user;
      // console.log('User verified:', user.username);
    } catch (err) {
      // console.log('JWT Verification failed:', (err as Error).message);
      if (options.protected) {
        return reply.status(401).send({ error: 'Sessió caducada o no vàlida' });
      }
    }

    if (user && options.protected) {
      const isMutation = ['POST', 'PUT', 'DELETE'].includes(request.method);
      const query = request.query as any;
      const targetAdfId = Number(query?.adf || (request.body as any)?.adf_id);

      // Lògica de permisos:
      // 1. Admin pot fer-ho tot
      // 2. Editor només pot mutar la seva pròpia ADF
      if (user.role !== 'admin' && isMutation) {
        if (user.adf_id !== targetAdfId) {
          return reply
            .status(403)
            .send({ error: 'No tens permisos per editar aquesta ADF' });
        }
      }
    }

    const req: ApiRequest = {
      method: request.method,
      query: request.query,
      body: request.body,
      headers: request.headers,
      params: request.params,
      url: request.url,
      user,
    };

    const res = createRes(reply, app, request);

    try {
      await handler(req, res);
    } catch (err) {
      throw err;
    }
  };
}

/**
 * RUTES
 */
const routes = [
  { path: '/api/auth/login', handler: login },
  { path: '/api/auth/logout', handler: logout },
  { path: '/api/auth/me', handler: me },
  { path: '/api/overpass', handler: overpass },
  { path: '/api/hidrants/sync', handler: hidrants, protected: true },
  { path: '/api/hidrants', handler: hidrants },
  { path: '/api/hidrants/:id', handler: hidrants },
  { path: '/api/sendToTelegram', handler: sendToTelegram },
  { path: '/api/route', handler: route },
  { path: '/api/adf', handler: municipi },
  { path: '/api/adfs', handler: municipisList },
  { path: '/api/adf/boundary', handler: boundary },
  { path: '/api/incidencies', handler: incidencies },
  { path: '/api/incidencies/:id', handler: incidencies },
  { path: '/api/incidencies/:id/events', handler: incidencies },
  { path: '/api/tracking', handler: tracking },
];

routes.forEach((r) => {
  const isMutation = (r.path.includes('/hidrants') || r.path.includes('/incidencies')) && 
    (r.handler === hidrants || r.handler === incidencies);

  app.all(r.path, async (request, reply) => {
    const needsAuth =
      r.protected ||
      (isMutation && ['POST', 'PUT', 'DELETE'].includes(request.method));
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
    console.log('🚀 API running on port', config.PORT);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
