/* eslint-disable @typescript-eslint/no-explicit-any -- adapter Express simplificat, vegeu types.ts */
import type { FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";

import overpass from "./routes/overpass.js";
import sendToTelegram from "./routes/sendToTelegram.js";
import route from "./routes/route.js";
import municipi from "./routes/municipi.js";
import municipisList from "./routes/municipis.js";
import boundary from "./routes/boundary.js";
import hidrants from "./routes/hidrants.js";
import incidencies from "./routes/incidencies.js";
import { login, me, logout } from "./routes/auth.js";
import users from "./routes/users.js";
import tracking from "./routes/tracking.js";
import trackingSharing from "./routes/trackingSharing.js";
import telegram from "./routes/telegram.js";
import telegramWebhook from "./routes/telegramWebhook.js";
import osm from "./routes/osm.js";
import { startMqttService, stopMqttService } from "./services/mqtt.js";
import sqlite from "./db/index.js";

import type { ApiHandler, ApiRequest } from "./types.js";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import { permissionsFor, type Permission } from "./permissions.js";

const app = Fastify({
  logger: { level: config.FASTIFY_LOGLEVEL },
});

app.register(fastifyCookie);

app.register(fastifyJwt, {
  secret: config.JWT_SECRET,
  cookie: {
    cookieName: "auth_token",
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
  return reply.status(500).send({ error: "Internal server error (500)" });
});

/**
 * Adapter de resposta (simplificat, sense subdominis)
 */
interface ResAdapter {
  status: (code: number) => ResAdapter;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
  _userToSign?: { id: string; username: string; adf_id: number | null; role: string };
  _clearCookie?: boolean;
}

function createRes(reply: FastifyReply, app: any, request: FastifyRequest): ResAdapter {
  const adapter: ResAdapter = {
    status(code: number) {
      reply.code(code);
      return adapter;
    },

    json(data: any) {
      // Si el handler ha marcat un usuari per signar (cas del login)
      if (adapter._userToSign) {
        const token = app.jwt.sign(adapter._userToSign);
        data.token = token;

        const cookieOptions: any = {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 dies
        };

        // Si estem en producció o l'usuari accedeix per HTTPS, marquem la cookie com a segura
        if (
          process.env.NODE_ENV === "production" ||
          request.protocol === "https" ||
          request.headers["x-forwarded-proto"] === "https"
        ) {
          cookieOptions.secure = true;
        }

        reply.setCookie("auth_token", token, cookieOptions);
      }

      // Si el handler ha demanat esborrar la cookie (cas del logout)
      if (adapter._clearCookie) {
        reply.clearCookie("auth_token", {
          path: "/",
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

  return adapter;
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
    } catch {
      if (options.protected) {
        return reply.status(401).send({ error: "Sessió caducada o no vàlida" });
      }
    }

    if (user && options.protected) {
      const isMutation = ["POST", "PUT", "DELETE"].includes(request.method);
      const query = request.query as any;
      const targetAdfId = Number(query?.adf || (request.body as any)?.adf_id);
      const perms = new Set(permissionsFor(user.role));
      const url = request.url.split("?")[0];

      // Permís requerit per operació (GET sense mutació no requereix cap)
      const required: Permission | null =
        url.endsWith("/sync") || url.includes("/api/osm")
          ? "sync_osm"
          : url.includes("/incidencies")
            ? isMutation
              ? "create_incidencia"
              : null
            : url.includes("/hidrants")
              ? request.method === "DELETE"
                ? "delete_hydrant"
                : request.method === "POST"
                  ? "create_hydrant"
                  : request.method === "PUT"
                    ? "edit_hydrant"
                    : null
              : null;

      if (required && !perms.has(required)) {
        return reply.status(403).send({ error: "No tens permisos per realitzar aquesta acció" });
      }

      // Propietat de l'ADF: només la pròpia (admin exempte)
      if (
        user.role !== "admin" &&
        isMutation &&
        !isNaN(targetAdfId) &&
        user.adf_id !== targetAdfId
      ) {
        return reply.status(403).send({ error: "No tens permisos per editar aquesta ADF" });
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

    await handler(req, res);
  };
}

/**
 * RUTES
 */
const routes = [
  { path: "/api/auth/login", handler: login },
  { path: "/api/auth/logout", handler: logout },
  { path: "/api/auth/me", handler: me },
  { path: "/api/overpass", handler: overpass },
  { path: "/api/hidrants/sync", handler: hidrants, protected: true },
  { path: "/api/hidrants", handler: hidrants },
  { path: "/api/hidrants/:id", handler: hidrants },
  { path: "/api/sendToTelegram", handler: sendToTelegram },
  { path: "/api/route", handler: route },
  { path: "/api/adf", handler: municipi },
  { path: "/api/adfs", handler: municipisList },
  { path: "/api/adf/boundary", handler: boundary },
  { path: "/api/incidencies", handler: incidencies },
  { path: "/api/incidencies/:id", handler: incidencies },
  { path: "/api/incidencies/:id/events", handler: incidencies },
  { path: "/api/tracking/status", handler: tracking.status, protected: true },
  { path: "/api/tracking/positions", handler: tracking.positions, protected: true },
  { path: "/api/tracking/enable", handler: tracking.enable, protected: true },
  { path: "/api/tracking/config", handler: tracking.config, protected: true },
  { path: "/api/adfs/:id/tracking-sharing", handler: trackingSharing, protected: true },
  { path: "/api/adfs/:id/telegram", handler: telegram.handle, protected: true },
  { path: "/api/adfs/:id/telegram/status", handler: telegram.status, protected: true },
  { path: "/api/adfs/:id/telegram/link", handler: telegram.link, protected: true },
  { path: "/api/adfs/:id/telegram/test", handler: telegram.test, protected: true },
  { path: "/api/telegram/webhook/:secret", handler: telegramWebhook },
  { path: "/api/users", handler: users, protected: true },
  { path: "/api/users/:id", handler: users, protected: true },
  { path: "/api/osm/status", handler: osm, protected: true },
  { path: "/api/osm/pending", handler: osm, protected: true },
  { path: "/api/osm/push-sync", handler: osm, protected: true },
  { path: "/api/osm/push-selected", handler: osm, protected: true },
  { path: "/api/osm/discard-selected", handler: osm, protected: true },
  { path: "/api/osm/conflicts", handler: osm, protected: true },
  { path: "/api/osm/conflicts/osc", handler: osm, protected: true },
  { path: "/api/osm/conflicts/resolve", handler: osm, protected: true },
  { path: "/api/osm/pull-hydrant", handler: osm, protected: true },
  { path: "/api/osm/diff/:id", handler: osm, protected: true },
  { path: "/api/osm/reviews", handler: osm, protected: true },
];

routes.forEach((r) => {
  const isMutation =
    (r.path.includes("/hidrants") || r.path.includes("/incidencies")) &&
    (r.handler === hidrants || r.handler === incidencies);

  app.all(r.path, async (request, reply) => {
    const needsAuth =
      r.protected || (isMutation && ["POST", "PUT", "DELETE"].includes(request.method));
    return wrap(r.handler, { protected: needsAuth })(request, reply);
  });
});

/**
 * START SERVER
 */
const start = async () => {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: config.PORT,
    });
    console.log("🚀 API running on port", config.PORT);

    startMqttService().catch((err: Error) => {
      console.log(`[MQTT] ⚠️ Servei no disponible: ${err.message}`);
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();

// Aturada ordenada (Ctrl+C / SIGTERM): tanca Fastify, MQTT i SQLite perquè tsx watch surti net.
let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log("🛑 Aturant servei...");
  try {
    void app.close();
  } catch {
    /* noop */
  }
  stopMqttService();
  try {
    sqlite.close();
  } catch {
    /* noop */
  }
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
