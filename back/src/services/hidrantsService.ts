import { v4 as uuidv4 } from 'uuid';
import { HidrantsRepository } from '../db/repositories/hidrantsRepository.js';
import { syncMunicipiFromOSM } from './osmSync.js';
import { NotFoundError, BadRequestError } from '../errors.js';

export const HidrantsService = {
  async forceSync(municipi: string) {
    const count = await syncMunicipiFromOSM(municipi);
    return count;
  },

  async getGeoJson(municipi: string) {
    const count = HidrantsRepository.countByMunicipi(municipi);

    if (count === 0) {
      console.log(`[Service] Inicialitzant dades per ${municipi}...`);
      try {
        await syncMunicipiFromOSM(municipi);
      } catch (syncErr) {
        console.error(`[Service] Failed initial sync for ${municipi}:`, syncErr);
      }
    }

    const rows = HidrantsRepository.findActiveByMunicipi(municipi);

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

    return {
      type: 'FeatureCollection',
      features
    };
  },

  createLocal(municipi: string, lat: number, lon: number, osm_tags: any, private_tags: any) {
    if (!lat || !lon) {
      throw new BadRequestError('Missing lat or lon');
    }

    const id = uuidv4();
    HidrantsRepository.create({
      id,
      municipi,
      lat,
      lon,
      osm_tags: JSON.stringify(osm_tags || {}),
      private_tags: JSON.stringify(private_tags || {}),
      sync_status: 'PENDING_CREATE'
    });

    return { id, sync_status: 'PENDING_CREATE' };
  },

  updateLocal(id: string, municipi: string, lat?: number, lon?: number, osm_tags?: any, private_tags?: any) {
    if (!id) throw new BadRequestError('Missing hydrant ID');

    const current = HidrantsRepository.findByIdAndMunicipi(id, municipi);
    if (!current) throw new NotFoundError('Hydrant not found');

    let newSyncStatus = current.sync_status;
    if (current.sync_status === 'SYNCED') {
      newSyncStatus = 'PENDING_UPDATE';
    }

    HidrantsRepository.update(id, municipi, {
      lat,
      lon,
      osm_tags: osm_tags ? JSON.stringify(osm_tags) : undefined,
      private_tags: private_tags ? JSON.stringify(private_tags) : undefined,
      sync_status: newSyncStatus
    });

    return { success: true, sync_status: newSyncStatus };
  },

  deleteLocal(id: string, municipi: string) {
    if (!id) throw new BadRequestError('Missing hydrant ID');

    const current = HidrantsRepository.findByIdAndMunicipi(id, municipi);
    if (!current) throw new NotFoundError('Hydrant not found');

    if (current.sync_status === 'PENDING_CREATE') {
      HidrantsRepository.delete(id);
    } else {
      HidrantsRepository.markForDeletion(id);
    }

    return { success: true };
  }
};
