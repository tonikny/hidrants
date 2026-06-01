import { v4 as uuidv4 } from 'uuid';
import { HidrantsRepository } from '../db/repositories/hidrantsRepository.js';
import { syncAdfFromOSM } from './osmSync.js';
import { NotFoundError, BadRequestError } from '../errors.js';
import { osm2Ui, ui2Osm } from '../utils/osmConversion.js';

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

  createLocal(adfId: number, lat: number, lon: number, ui_fields: any, private_tags: any) {
    if (!lat || !lon) {
      throw new BadRequestError('Missing lat or lon');
    }

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

  updateLocal(id: string, adfId: number, lat?: number, lon?: number, ui_fields?: any, private_tags?: any) {
    if (!id) throw new BadRequestError('Missing hydrant ID');

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) throw new NotFoundError('Hydrant not found');

    let newSyncStatus = current.sync_status;
    if (current.sync_status === 'SYNCED') {
      newSyncStatus = 'PENDING_UPDATE';
    }

    let osm_tags = undefined;
    if (ui_fields) {
      const currentOsmTags = JSON.parse(current.osm_tags || '{}');
      const newTags = ui2Osm(ui_fields);
      const merged = {
        ...currentOsmTags,
        ...newTags
      };
      
      // Netegem tags que s'han marcat per eliminar (valor buit)
      osm_tags = Object.fromEntries(
        Object.entries(merged).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
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
    if (!id) throw new BadRequestError('Missing hydrant ID');

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) throw new NotFoundError('Hydrant not found');

    if (current.sync_status === 'PENDING_CREATE') {
      HidrantsRepository.delete(id);
    } else {
      HidrantsRepository.markForDeletion(id);
    }

    return { success: true };
  }
};
