import { v4 as uuidv4 } from 'uuid';
import { HidrantsRepository } from '../db/repositories/hidrantsRepository.js';
import { syncAdfFromOSM } from './osmSync.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors.js';
import { osm2Ui, ui2Osm, type HydrantUiFields } from '../utils/osmConversion.js';
import { db } from '../db/index.js';
import { adfs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isPointInBoundary, clampToMaxDistance, MAX_HYDRANT_MOVE_METERS } from '../utils/geo.js';

export const HidrantsService = {
  async forceSync(adfId: number) {
    const count = await syncAdfFromOSM(adfId);
    return count;
  },

  async getGeoJson(adfId: number) {
    const count = HidrantsRepository.countByAdf(adfId);

    if (count === 0) {
      console.log(`[Service] Inicialitzant dades per ADF ${adfId}...`);
      try {
        await syncAdfFromOSM(adfId);
      } catch (syncErr) {
        console.error(`[Service] Failed initial sync for ADF ${adfId}:`, syncErr);
      }
    }

    const rows = HidrantsRepository.findActiveByAdf(adfId);

    const features = rows.map(row => {
      const osm_tags = JSON.parse(row.osm_tags || '{}');
      const ui_fields = osm2Ui(osm_tags);

      return {
        type: 'Feature',
        id: row.id,
        geometry: {
          type: 'Point',
          coordinates: [row.lon, row.lat]
        },
        properties: {
          id: row.id,
          osm_id: row.osm_id,
          osm_tags, // Ara van en el seu propi objecte, no escampats
          ui_fields,
          private_tags: JSON.parse(row.private_tags || '{}'),
          sync_status: row.sync_status,
          updated_at: row.updated_at
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  },

  createLocal(adfId: number, lat: number, lon: number, ui_fields?: HydrantUiFields, private_tags?: Record<string, unknown>) {
    if (!lat || !lon) {
      throw new BadRequestError('Missing lat or lon');
    }

    const adf = db.select({ boundary_geojson: adfs.boundary_geojson }).from(adfs).where(eq(adfs.id, adfId)).get();
    if (!isPointInBoundary(lat, lon, adf?.boundary_geojson ?? null))
      {throw new ForbiddenError('Coordenades fora del límit de l\'ADF');}

    const osm_tags = ui_fields ? ui2Osm(ui_fields) : {};
    const id = uuidv4();
    
    HidrantsRepository.create({
      id,
      adf_id: adfId,
      lat,
      lon,
      osm_tags: JSON.stringify(osm_tags),
      private_tags: JSON.stringify(private_tags || {}),
      sync_status: 'PENDING_CREATE'
    });

    return { id, sync_status: 'PENDING_CREATE' };
  },

  updateLocal(id: string, adfId: number, lat?: number, lon?: number, ui_fields?: HydrantUiFields, private_tags?: Record<string, unknown>) {
    if (!id) {throw new BadRequestError('Missing hydrant ID');}

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) {throw new NotFoundError('Hydrant not found');}

    // Limitem el desplaçament respecte a la posició original (defensa en profunditat,
    // el frontend ja fa el mateix clamp visualment durant el drag).
    if (lat !== undefined || lon !== undefined) {
      const clamped = clampToMaxDistance(
        current.lat,
        current.lon,
        lat ?? current.lat,
        lon ?? current.lon,
        MAX_HYDRANT_MOVE_METERS
      );
      lat = clamped.lat;
      lon = clamped.lon;
    }

    // Determinem si hi ha canvis que afecten OSM (lat, lon, osm_tags)
    let hasOsmChanges = false;
    
    // Comprovar canvis de posició
    if (lat !== undefined && lat !== current.lat) {hasOsmChanges = true;}
    if (lon !== undefined && lon !== current.lon) {hasOsmChanges = true;}
    
    if (hasOsmChanges && (lat !== undefined || lon !== undefined)) {
      const finalLat = lat ?? current.lat;
      const finalLon = lon ?? current.lon;
      const adf = db.select({ boundary_geojson: adfs.boundary_geojson }).from(adfs).where(eq(adfs.id, adfId)).get();
      if (!isPointInBoundary(finalLat, finalLon, adf?.boundary_geojson ?? null))
        {throw new ForbiddenError('Coordenades fora del límit de l\'ADF');}
    }

    // Comprovar canvis en osm_tags
    let osm_tags = undefined;
    if (ui_fields) {
      const currentOsmTags = JSON.parse(current.osm_tags || '{}');
      const newTags = ui2Osm(ui_fields);

      if (ui_fields.estat) {
        delete currentOsmTags['emergency'];
        delete currentOsmTags['disused:emergency'];
      }

      osm_tags = {
        ...currentOsmTags,
        ...newTags
      };
      
      // Comparar si realment han canviat els tags
      if (JSON.stringify(osm_tags) !== JSON.stringify(JSON.parse(current.osm_tags || '{}'))) {
        hasOsmChanges = true;
      }
    }

    // Només canviar sync_status si hi ha canvis que afecten OSM
    let newSyncStatus = current.sync_status;
    if (hasOsmChanges && current.sync_status === 'SYNCED') {
      newSyncStatus = 'PENDING_UPDATE';
    }

    HidrantsRepository.update(id, adfId, {
      lat,
      lon,
      osm_tags: osm_tags ? JSON.stringify(osm_tags) : undefined,
      private_tags: private_tags ? JSON.stringify(private_tags) : undefined,
      sync_status: newSyncStatus
    });

    return { success: true, sync_status: newSyncStatus };
  },

  deleteLocal(id: string, adfId: number) {
    if (!id) {throw new BadRequestError('Missing hydrant ID');}

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) {throw new NotFoundError('Hydrant not found');}

    if (current.sync_status === 'PENDING_CREATE') {
      HidrantsRepository.delete(id);
    } else {
      HidrantsRepository.markForDeletion(id);
    }

    return { success: true };
  },

  getSyncStats(adfId: number) {
    return HidrantsRepository.getSyncStats(adfId);
  }
};
