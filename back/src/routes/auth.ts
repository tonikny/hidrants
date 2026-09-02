import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, mqttUsers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import type { ApiHandler } from "../types.js";
import { permissionsFor } from "../permissions.js";

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

    res._userToSign = {
      id: user.id,
      username: user.username,
      adf_id: user.adf_id,
      role: user.role ?? "editor",
    };

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        adf_id: user.adf_id,
        role: user.role,
      },
    });
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

  const mqttRow = db
    .select()
    .from(mqttUsers)
    .where(and(eq(mqttUsers.user_id, req.user.id), eq(mqttUsers.enabled, true)))
    .get();

  return res.json({
    user: {
      ...req.user,
      mqtt_enabled: !!mqttRow,
      permissions: permissionsFor(req.user.role),
    },
  });
};
