import { MAX_HYDRANT_MOVE_METERS } from "../utils/geo.js";
import type { ApiHandler } from "../types.js";

/**
 * Configuració pública que el frontend necessita i que ha de coincidir amb la validació del backend.
 * Així el límit de moviment d'un hidrant es defineix només aquí (MAX_HYDRANT_MOVE_METERS).
 */
const handler: ApiHandler = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  res.json({ max_hydrant_move_meters: MAX_HYDRANT_MOVE_METERS });
};

export default handler;
