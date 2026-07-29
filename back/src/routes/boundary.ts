import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import type { ApiHandler } from '../types.js';
import { eq } from 'drizzle-orm';

const handler: ApiHandler = async (req, res) => {
  const adf_id = Number(req.query?.adf);

  if (!adf_id) {
    return res.status(400).json({ error: 'No adf id' });
  }

  const adf = db.select({ boundary_geojson: adfs.boundary_geojson }).from(adfs).where(eq(adfs.id, adf_id)).get();

  if (!adf || !adf.boundary_geojson) {
    return res.status(404).json({ error: 'Boundary not found' });
  }

  return res.json(JSON.parse(adf.boundary_geojson));
};

export default handler;
