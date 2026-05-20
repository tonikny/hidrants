import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { syncMunicipiFromOSM } from '../services/osmSync.js';
import type { ApiHandler } from '../types.js';

const handler: ApiHandler = async (req, res) => {
  const { method, municipi, url } = req;

  if (!municipi) {
    return res.status(400).json({ error: 'Municipi not identified. Use a valid subdomain.' });
  }

  try {
    // --- POST /api/hidrants/sync: Forçar sincronització amb OSM ---
    if (method === 'POST' && url?.endsWith('/sync')) {
      console.log(`[API] Forçant sincronització d'OSM per a ${municipi}...`);
      const count = await syncMunicipiFromOSM(municipi);
      return res.json({ success: true, message: `Sincronitzats ${count} hidrants d'OSM.` });
    }

    // --- GET: Llistar hidrants (GeoJSON) ---
    if (method === 'GET') {
      console.log(`[API] GET /api/hidrants for municipi: ${municipi}`);
      // 1. Comprovar si tenim dades per aquest municipi
      const count = db.prepare('SELECT COUNT(*) as count FROM hidrants WHERE municipi = ?').get(municipi) as { count: number };

      // Si no n'hi ha cap, fem una sincronització inicial
      if (count && count.count === 0) {
        console.log(`[API] Inicialitzant dades per ${municipi}...`);
        try {
          await syncMunicipiFromOSM(municipi);
        } catch (syncErr) {
          console.error(`[API] Failed initial sync for ${municipi}:`, syncErr);
          // Continuem, potser n'hi ha algun local o simplement retornem buit
        }
      }

      // 2. Obtenir tots els hidrants del municipi (excepte els marcats per esborrar)
      // ✅ Filtrem els que tenen estat PENDING_DELETE perquè l'usuari no els vegi.
      const rows = db.prepare(`
        SELECT * FROM hidrants 
        WHERE municipi = ? 
        AND sync_status != 'PENDING_DELETE'
      `).all(municipi) as any[];

      // 3. Convertir a GeoJSON
      // ✅ El backend ara cuina el GeoJSON directament per estalviar feina al frontend.
      const features = rows.map(row => ({
        type: 'Feature',
        id: row.id,
        geometry: {
          type: 'Point',
          coordinates: [row.lon, row.lat]
        },
        properties: {
          id: row.id,
          osm_id: row.osm_id,
          ...JSON.parse(row.osm_tags || '{}'),
          private_tags: JSON.parse(row.private_tags || '{}'),
          sync_status: row.sync_status,
          updated_at: row.updated_at
        }
      }));

      return res.json({
        type: 'FeatureCollection',
        features
      });
    }

    // --- POST: Crear nou hidrant local ---
    if (method === 'POST') {
      const { lat, lon, osm_tags, private_tags } = req.body;

      if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon' });
      }

      const id = uuidv4();
      const insert = db.prepare(`
        INSERT INTO hidrants (id, municipi, lat, lon, osm_tags, private_tags, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING_CREATE')
      `);

      insert.run(
        id,
        municipi,
        lat,
        lon,
        JSON.stringify(osm_tags || {}),
        JSON.stringify(private_tags || {}),
      );

      return res.status(201).json({ id, sync_status: 'PENDING_CREATE' });
    }

    // --- PUT: Actualitzar hidrant ---
    if (method === 'PUT') {
      const id = req.params?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'Missing hydrant ID' });

      const { lat, lon, osm_tags, private_tags } = req.body;
      
      // Busquem el node actual
      const current = db.prepare('SELECT * FROM hidrants WHERE id = ? AND municipi = ?').get(id, municipi) as any;
      if (!current) return res.status(404).json({ error: 'Hydrant not found' });

      // Si el node estava SYNCED, ara passarà a PENDING_UPDATE (si canviem algo d'OSM)
      // Si només canviem private_tags, podríem mantenir SYNCED o tenir un estat "SYNCED_WITH_PRIVATE_CHANGES"?
      // Per simplificar, qualsevol canvi el marca com a pendent de revisió/sincro si toca camps OSM.
      let newSyncStatus = current.sync_status;
      if (current.sync_status === 'SYNCED') {
        newSyncStatus = 'PENDING_UPDATE';
      }

      const update = db.prepare(`
        UPDATE hidrants SET
          lat = COALESCE(?, lat),
          lon = COALESCE(?, lon),
          osm_tags = COALESCE(?, osm_tags),
          private_tags = COALESCE(?, private_tags),
          sync_status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND municipi = ?
      `);

      update.run(
        lat,
        lon,
        osm_tags ? JSON.stringify(osm_tags) : null,
        private_tags ? JSON.stringify(private_tags) : null,
        newSyncStatus,
        id,
        municipi
      );

      return res.json({ success: true, sync_status: newSyncStatus });
    }

    // --- DELETE: Esborrar hidrant ---
    if (method === 'DELETE') {
      const id = req.params?.id || req.query?.id;
      if (!id) return res.status(400).json({ error: 'Missing hydrant ID' });

      // Si és un node que encara no s'ha pujat a OSM (PENDING_CREATE), el podem esborrar directament
      const current = db.prepare('SELECT sync_status FROM hidrants WHERE id = ? AND municipi = ?').get(id, municipi) as any;
      
      if (!current) return res.status(404).json({ error: 'Hydrant not found' });

      if (current.sync_status === 'PENDING_CREATE') {
        db.prepare('DELETE FROM hidrants WHERE id = ?').run(id);
      } else {
        // Si ja existia a OSM, el marquem per esborrar a la propera sincronització de pujada
        db.prepare(`
          UPDATE hidrants SET 
            sync_status = 'PENDING_DELETE',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(id);
      }

      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`[API Hidrants] Error en ${method}:`, err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export default handler;
