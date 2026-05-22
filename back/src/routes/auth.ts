import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or, and } from 'drizzle-orm';
import { ApiHandler } from '../types.js';

/**
 * Login handler
 * POST /api/auth/login
 * Body: { username, password }
 */
export const login: ApiHandler = async (req, res) => {
  const { username, password } = req.body;
  const { municipi } = req;

  if (!username || !password) {
    return res.status(400).json({ error: 'Falten credencials' });
  }

  try {
    const targetMunicipi = municipi || 'general';
    const user = db.select()
      .from(users)
      .where(
        and(
          eq(users.username, username),
          or(
            eq(users.municipi, targetMunicipi),
            eq(users.municipi, 'general')
          )
        )
      )
      .get();

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Usuari o contrasenya incorrectes' });
    }

    (res as any)._userToSign = {
      id: user.id,
      username: user.username,
      municipi: user.municipi,
      role: user.role
    };
    
    return res.status(200).json({ 
      user: {
        id: user.id,
        username: user.username,
        municipi: user.municipi,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Auth] Login error details:', err);
    res.status(500).json({ error: `Error intern: ${(err as Error).message}` });
  }
};

/**
 * Logout handler
 * POST /api/auth/logout
 */
export const logout: ApiHandler = async (req, res) => {
  (res as any)._clearCookie = true;
  return res.status(200).json({ success: true });
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const me: ApiHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticat' });
  }
  return res.json({ user: req.user });
};
