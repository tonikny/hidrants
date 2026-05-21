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
  const { method, municipi, url } = req;

  if (!municipi) {
    throw new BadRequestError('Municipi not identified. Use a valid subdomain.');
  }

  // --- POST /api/hidrants/sync: Forçar sincronització amb OSM ---
  if (method === 'POST' && url?.endsWith('/sync')) {
    console.log(`[API] Forçant sincronització d'OSM per a ${municipi}...`);
    const count = await HidrantsService.forceSync(municipi);
    return res.json({ success: true, message: `Sincronitzats ${count} hidrants d'OSM.` });
  }

  // --- GET: Llistar hidrants (GeoJSON) ---
  if (method === 'GET') {
    console.log(`[API] GET /api/hidrants for municipi: ${municipi}`);
    const geoJson = await HidrantsService.getGeoJson(municipi);
    return res.json(geoJson);
  }

  // --- POST: Crear nou hidrant local ---
  if (method === 'POST') {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.message);
    }
    const { lat, lon, osm_tags, private_tags } = parsed.data;
    const result = HidrantsService.createLocal(municipi, lat, lon, osm_tags, private_tags);
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
    const result = HidrantsService.updateLocal(id, municipi, lat, lon, osm_tags, private_tags);
    return res.json(result);
  }

  // --- DELETE: Esborrar hidrant ---
  if (method === 'DELETE') {
    const id = req.params?.id || req.query?.id;
    const result = HidrantsService.deleteLocal(id, municipi);
    return res.json(result);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
