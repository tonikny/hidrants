import { HidrantsService } from '../services/hidrantsService.js';
import type { ApiHandler } from '../types.js';
import { BadRequestError } from '../errors.js';
import { z } from 'zod';

const createSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  osm_tags: z.any().optional(),
  private_tags: z.any().optional()
});

const updateSchema = z.object({
  id: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  osm_tags: z.any().optional(),
  private_tags: z.any().optional()
});

const handler: ApiHandler = async (req, res) => {
  const { method, url, query } = req;
  const adf_id = Number(query?.adf || req.body?.adf_id);

  if (!adf_id) {
    throw new BadRequestError('ADF ID not identified.');
  }

  // --- POST /api/hidrants/sync: Forçar sincronització amb OSM ---
  if (method === 'POST' && url?.endsWith('/sync')) {
    const count = await HidrantsService.forceSync(adf_id);
    return res.json({ success: true, message: `Sincronitzats ${count} hidrants d'OSM.` });
  }

  // --- GET: Llistar hidrants (GeoJSON) ---
  if (method === 'GET') {
    const geoJson = await HidrantsService.getGeoJson(adf_id);
    return res.json(geoJson);
  }

  // --- POST: Crear nou hidrant local ---
  if (method === 'POST') {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.message);
    }
    const { lat, lon, osm_tags, private_tags } = parsed.data;
    const result = HidrantsService.createLocal(adf_id, lat, lon, osm_tags, private_tags);
    return res.status(201).json(result);
  }

  // --- PUT: Actualitzar hidrant ---
  if (method === 'PUT') {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.message);
    }
    const id = req.params?.id || parsed.data.id;
    if (!id) throw new BadRequestError('Missing hydrant ID');

    const { lat, lon, osm_tags, private_tags } = parsed.data;
    const result = HidrantsService.updateLocal(id, adf_id, lat, lon, osm_tags, private_tags);
    return res.json(result);
  }

  // --- DELETE: Esborrar hidrant ---
  if (method === 'DELETE') {
    const id = req.params?.id || req.query?.id;
    const result = HidrantsService.deleteLocal(id, adf_id);
    return res.json(result);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
