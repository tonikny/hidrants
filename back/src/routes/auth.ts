import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
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

  if (!municipi) {
    return res.status(400).json({ error: 'Municipi no identificat' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND municipi = ?').get(username, municipi) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Usuari o contrasenya incorrectes' });
    }

    // El token el signarem des del server.ts o passant una utilitat
    // Però com que estem en un wrapper, podem retornar les dades per a que el wrapper les signi
    // O millor: injectem la funció de signat si cal. 
    // Per ara, retornem la info de l'usuari i que el server.ts s'encarregui de la resposta si volem ser puristes,
    // o simplement passem el 'app' al wrap.
    
    // Simplificació: el handler de login serà especial i rebrà la app o el signat.
    // Però per mantenir la teva estructura de 'ApiHandler', farem que el login retorni la info
    // i el server.ts (que té accés a app.jwt) faci el signat.
    
    // Espera, puc importar jsonwebtoken o usar el secret directament aquí si vull.
    // Però usarem el mètode de Fastify.
    
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
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Error intern' });
  }
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
