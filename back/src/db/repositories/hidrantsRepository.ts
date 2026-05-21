import db from '../index.js';

export interface HidrantData {
  id: string;
  osm_id?: number;
  municipi: string;
  lat: number;
  lon: number;
  osm_tags?: string;
  private_tags?: string;
  sync_status: string;
  created_at?: string;
  updated_at?: string;
}

export const HidrantsRepository = {
  countByMunicipi(municipi: string): number {
    const res = db.prepare('SELECT COUNT(*) as count FROM hidrants WHERE municipi = ?').get(municipi) as { count: number };
    return res?.count || 0;
  },

  findActiveByMunicipi(municipi: string): HidrantData[] {
    return db.prepare(`
      SELECT * FROM hidrants 
      WHERE municipi = ? 
      AND sync_status != 'PENDING_DELETE'
    `).all(municipi) as HidrantData[];
  },

  findByIdAndMunicipi(id: string, municipi: string): HidrantData | undefined {
    return db.prepare('SELECT * FROM hidrants WHERE id = ? AND municipi = ?').get(id, municipi) as HidrantData | undefined;
  },

  create(data: Omit<HidrantData, 'created_at' | 'updated_at'>): void {
    const insert = db.prepare(`
      INSERT INTO hidrants (id, municipi, lat, lon, osm_tags, private_tags, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      data.id,
      data.municipi,
      data.lat,
      data.lon,
      data.osm_tags || '{}',
      data.private_tags || '{}',
      data.sync_status
    );
  },

  update(id: string, municipi: string, data: Partial<HidrantData>): void {
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
      data.lat ?? null,
      data.lon ?? null,
      data.osm_tags ?? null,
      data.private_tags ?? null,
      data.sync_status,
      id,
      municipi
    );
  },

  delete(id: string): void {
    db.prepare('DELETE FROM hidrants WHERE id = ?').run(id);
  },

  markForDeletion(id: string): void {
    db.prepare(`
      UPDATE hidrants SET 
        sync_status = 'PENDING_DELETE',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }
};
