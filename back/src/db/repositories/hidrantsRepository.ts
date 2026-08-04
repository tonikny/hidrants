import { db } from '../index.js';
import { hidrants } from '../schema.js';
import { count, eq, and, ne, sql } from 'drizzle-orm';

type SyncStatus = 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE';

export interface HidrantData {
  id: string;
  osm_id?: number | null;
  adf_id: number | null;
  lat: number;
  lon: number;
  osm_tags?: string | null;
  private_tags?: string | null;
  sync_status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const HidrantsRepository = {
  countByAdf(adfId: number): number {
    const res = db.select({ count: count() })
      .from(hidrants)
      .where(eq(hidrants.adf_id, adfId))
      .get();
    return res?.count || 0;
  },

  findActiveByAdf(adfId: number): HidrantData[] {
    return db.select()
      .from(hidrants)
      .where(
        and(
          eq(hidrants.adf_id, adfId),
          ne(hidrants.sync_status, 'PENDING_DELETE')
        )
      ).all() as HidrantData[];
  },

  findByIdAndAdf(id: string, adfId: number): HidrantData | undefined {
    return db.select()
      .from(hidrants)
      .where(
        and(
          eq(hidrants.id, id),
          eq(hidrants.adf_id, adfId)
        )
      ).get() as HidrantData | undefined;
  },

  findByOsmId(osmId: number): HidrantData | undefined {
    return db.select()
      .from(hidrants)
      .where(eq(hidrants.osm_id, osmId))
      .get() as HidrantData | undefined;
  },

  findNearbyPending(lat: number, lon: number, adfId: number, threshold = 0.00003): HidrantData | undefined {
    // Busquem hidrants PENDING_CREATE propers (aprox 3m de marge: 0.00003 ~ 3.3m)
    return db.select()
      .from(hidrants)
      .where(
        and(
          eq(hidrants.adf_id, adfId),
          eq(hidrants.sync_status, 'PENDING_CREATE'),
          sql`abs(${hidrants.lat} - ${lat}) < ${threshold}`,
          sql`abs(${hidrants.lon} - ${lon}) < ${threshold}`
        )
      ).get() as HidrantData | undefined;
  },

  create(data: Omit<HidrantData, 'created_at' | 'updated_at'>): void {
    db.insert(hidrants).values({
      id: data.id,
      osm_id: data.osm_id,
      adf_id: data.adf_id,
      lat: data.lat,
      lon: data.lon,
      osm_tags: data.osm_tags || '{}',
      private_tags: data.private_tags || '{}',
      sync_status: data.sync_status as SyncStatus,
    }).run();
  },

  update(id: string, adfId: number, data: Partial<HidrantData>): void {
    db.update(hidrants).set({
      lat: data.lat,
      lon: data.lon,
      osm_tags: data.osm_tags,
      private_tags: data.private_tags,
      sync_status: data.sync_status as SyncStatus,
      updated_at: sql`CURRENT_TIMESTAMP`,
    }).where(
      and(
        eq(hidrants.id, id),
        eq(hidrants.adf_id, adfId)
      )
    ).run();
  },

  delete(id: string): void {
    db.delete(hidrants).where(eq(hidrants.id, id)).run();
  },

  markForDeletion(id: string): void {
    db.update(hidrants).set({
      sync_status: 'PENDING_DELETE',
      updated_at: sql`CURRENT_TIMESTAMP`,
    }).where(eq(hidrants.id, id)).run();
  },

  getSyncStats(adfId: number) {
    const results = db.select({
      status: hidrants.sync_status,
      count: count(),
    })
      .from(hidrants)
      .where(eq(hidrants.adf_id, adfId))
      .groupBy(hidrants.sync_status)
      .all();

    const stats = {
      SYNCED: 0,
      PENDING_CREATE: 0,
      PENDING_UPDATE: 0,
      PENDING_DELETE: 0,
      total_pending: 0
    };

    for (const res of results) {
      const status = res.status as keyof typeof stats;
      if (status in stats) {
        stats[status] = res.count;
        if (status !== 'SYNCED') {
          stats.total_pending += res.count;
        }
      }
    }

    return stats;
  }
};
