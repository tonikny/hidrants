import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import type { ApiHandler } from '../types.js';
import { eq } from 'drizzle-orm';

const handler: ApiHandler = async (req, res) => {
  const adf_id = Number(req.query?.adf);

  if (!adf_id) {
    return res.status(400).json({ error: 'Falta adf id' });
  }

  const adf = db.select().from(adfs).where(eq(adfs.id, adf_id)).get();

  if (!adf) {
    return res.status(404).json({ error: 'ADF no trobada' });
  }

  // Parse JSON fields
  const data = {
    ...adf,
    osm_relations: JSON.parse(adf.osm_relations),
    bbox: adf.bbox ? JSON.parse(adf.bbox) : null,
    center: adf.center ? JSON.parse(adf.center) : null,
    boundary_geojson: adf.boundary_geojson ? JSON.parse(adf.boundary_geojson) : null,
  };

  return res.json(data);
};

export default handler;
