import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, mqttUsers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import type { ApiHandler } from "../types.js";
import { permissionsFor } from "../permissions.js";

/**
 * Usuari exposat al client. Mateix shape per a /login i /me: els permisos es deriven
 * del rol aquí (única font de veritat: back/src/permissions.ts), mai no vénen de la BD.
 */
function toPublicUser(user: {
  id: string;
  username: string;
  adf_id: number | null;
  role: string | null;
}) {
  // El rol a BD és nullable (default "voluntari"); normalitzem per no exposar null ni
  // signar un token amb un rol diferent del de la resposta.
  const role = user.role ?? "voluntari";

  const mqttRow = db
    .select()
    .from(mqttUsers)
    .where(and(eq(mqttUsers.user_id, user.id), eq(mqttUsers.enabled, true)))
    .get();

  return {
    id: user.id,
    username: user.username,
    adf_id: user.adf_id,
    role,
    mqtt_enabled: !!mqttRow,
    permissions: permissionsFor(role),
  };
}

/**
 * Login handler
 * POST /api/auth/login
 * Body: { username, password }
 */
export const login: ApiHandler = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Falten credencials" });
  }

  try {
    const user = db.select().from(users).where(eq(users.username, username)).get();

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Usuari o contrasenya incorrectes" });
    }

    const publicUser = toPublicUser(user);

    res._userToSign = {
      id: publicUser.id,
      username: publicUser.username,
      adf_id: publicUser.adf_id,
      role: publicUser.role,
    };

    return res.status(200).json({ user: publicUser });
  } catch (err) {
    req.log.child({ module: "auth", operation: "login" }).error({ err, username }, "Login error");
    res.status(500).json({ error: `Error intern: ${(err as Error).message}` });
  }
};

/**
 * Logout handler
 * POST /api/auth/logout
 */
export const logout: ApiHandler = async (req, res) => {
  res._clearCookie = true;
  return res.status(200).json({ success: true });
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const me: ApiHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticat" });
  }

  return res.json({ user: toPublicUser(req.user) });
};
