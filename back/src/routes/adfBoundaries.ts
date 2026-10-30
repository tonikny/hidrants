import { db } from "../db/index.js";
import { adfs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { ApiHandler } from "../types.js";
import { updateAdfBoundaries } from "../services/adfBoundaries.js";

/**
 * POST /api/adfs/:id/boundaries
 * Recalcula `bbox`, `center` i `boundary_geojson` a partir de les relacions OSM
 * de l'ADF (Nominatim). Només admin: és una operació costosa i externa.
 */
const handler: ApiHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Només l'administrador pot recalcular els límits" });
  }

  const adfId = Number(req.params?.id);
  if (!Number.isInteger(adfId) || adfId < 1 || adfId > 999) {
    return res.status(400).json({ error: "ID d'ADF no vàlid" });
  }

  await updateAdfBoundaries(adfId);

  const row = db.select().from(adfs).where(eq(adfs.id, adfId)).get();
  return res.json({
    success: true,
    adf_id: adfId,
    bbox: row?.bbox ? JSON.parse(row.bbox) : null,
    center: row?.center ? JSON.parse(row.center) : null,
  });
};

export default handler;
