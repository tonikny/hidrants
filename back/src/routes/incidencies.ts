import { IncidenciesService } from '../services/incidenciesService.js';
import type { ApiHandler } from '../types.js';
import { BadRequestError } from '../errors.js';
import { z } from 'zod';
import { appBaseUrl } from '../utils/appUrl.js';

const createSchema = z.object({
  titol: z.string(),
  tipus: z.string(),
  prioritat: z.enum(['BAIXA', 'MITJANA', 'ALTA']).optional(),
  lat: z.number(),
  lon: z.number(),
  precisio: z.enum(['DESCONEGUDA', 'MUNICIPI', 'AREA', 'EXACTA']).optional(),
  comentari: z.string().optional()
});

const eventSchema = z.object({
  tipus_event: z.string(),
  dades: z.any()
});

const handler: ApiHandler = async (req, res) => {
  const { method, user } = req;
  const isAdmin = user?.role === 'admin';
  const adf_id = Number(req.query?.adf || req.body?.adf_id || user?.adf_id);

  // Inferir URL base de l'app per a missatges de Telegram
  const clientBaseUrl = appBaseUrl(req);

  // --- GET /api/incidencies/:id: Detall d'una incidència ---
  // Aquest va primer perquè no necessita estrictament adf_id
  if (method === 'GET' && req.params?.id) {
    const result = await IncidenciesService.getIncidenciaById(req.params.id);
    return res.json(result);
  }

  // Per a la resta d'operacions, si no és admin cal adf_id
  if (!isAdmin && !adf_id) {
    throw new BadRequestError('ADF ID no identificada.');
  }

  // --- GET /api/incidencies: Llistar incidències (GeoJSON) ---
  if (method === 'GET' && !req.params?.id) {
    const includeClosed = req.query?.incloure_tancades === 'true';
    // Si és admin i no hi ha adf_id, passarem undefined per veure-les totes
    const queryAdf = (!adf_id && isAdmin) ? undefined : adf_id;
    const geoJson = await IncidenciesService.getIncidenciesGeoJson(queryAdf, includeClosed);
    return res.json(geoJson);
  }

  // --- POST /api/incidencies: Crear nova incidència ---
  if (method === 'POST' && !req.params?.id) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.message);
    }
    const result = IncidenciesService.createIncidencia({
      ...parsed.data,
      adf_id: adf_id || 0, // Fallback segur per admin
      usuari_id: user?.id || 'anonymous',
      nom_usuari: user?.username || 'Anònim',
      comentari: parsed.data.comentari,
      clientBaseUrl
    });
    return res.status(201).json(result);
  }

  // --- POST /api/incidencies/:id/events: Afegir esdeveniment ---
  if (method === 'POST' && req.params?.id) {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.message);
    }
    const result = IncidenciesService.addEvent(
      req.params.id,
      user?.id || 'anonymous',
      user?.username || 'Anònim',
      parsed.data.tipus_event as any,
      parsed.data.dades,
      clientBaseUrl
    );
    return res.status(201).json(result);
  }

  res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
