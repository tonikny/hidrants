import { MAX_HYDRANT_MOVE_METERS } from "../utils/geo.js";
import { ROLE_PERMISSIONS } from "../permissions.js";
import type { ApiHandler } from "../types.js";

/**
 * Configuració pública que el frontend necessita i que ha de coincidir amb el backend.
 * Així el límit de moviment d'un hidrant es defineix només aquí (MAX_HYDRANT_MOVE_METERS)
 * i la matriu rol → permisos només viu a back/src/permissions.ts: el front la consumeix
 * per a la vista "veure com" en lloc de mantenir-ne una còpia.
 */
const handler: ApiHandler = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  res.json({
    max_hydrant_move_meters: MAX_HYDRANT_MOVE_METERS,
    role_permissions: ROLE_PERMISSIONS,
  });
};

export default handler;
