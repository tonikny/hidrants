import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import type { ApiHandler } from '../types.js';

const handler: ApiHandler = async (req, res) => {
  const result = db.select().from(adfs).all();
  
  const data = result.map(adf => ({
    ...adf,
    osm_relations: JSON.parse(adf.osm_relations),
    bbox: adf.bbox ? JSON.parse(adf.bbox) : null,
    center: adf.center ? JSON.parse(adf.center) : null,
  }));

  return res.json(data);
};

export default handler;
