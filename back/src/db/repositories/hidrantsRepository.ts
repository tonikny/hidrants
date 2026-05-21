import { db } from '../index.js';
import { hidrants } from '../schema.js';
import { count, eq, and, ne, sql } from 'drizzle-orm';

export interface HidrantData {
  id: string;
  osm_id?: number | null;
  municipi: string | null;
  lat: number;
  lon: number;
  osm_tags?: string | null;
  private_tags?: string | null;
  sync_status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const HidrantsRepository = {
  countByMunicipi(municipi: string): number {
    const res = db.select({ count: count() })
      .from(hidrants)
      .where(eq(hidrants.municipi, municipi))
      .get();
    return res?.count || 0;
  },

  findActiveByMunicipi(municipi: string): HidrantData[] {
    return db.select()
      .from(hidrants)
      .where(
        and(
          eq(hidrants.municipi, municipi),
          ne(hidrants.sync_status, 'PENDING_DELETE')
        )
      ).all() as HidrantData[];
  },

  findByIdAndMunicipi(id: string, municipi: string): HidrantData | undefined {
    return db.select()
      .from(hidrants)
      .where(
        and(
          eq(hidrants.id, id),
          eq(hidrants.municipi, municipi)
        )
      ).get() as HidrantData | undefined;
  },

  create(data: Omit<HidrantData, 'created_at' | 'updated_at'>): void {
    db.insert(hidrants).values({
      id: data.id,
      municipi: data.municipi,
      lat: data.lat,
      lon: data.lon,
      osm_tags: data.osm_tags || '{}',
      private_tags: data.private_tags || '{}',
      sync_status: data.sync_status as any,
    }).run();
  },

  update(id: string, municipi: string, data: Partial<HidrantData>): void {
    db.update(hidrants).set({
      lat: data.lat,
      lon: data.lon,
      osm_tags: data.osm_tags,
      private_tags: data.private_tags,
      sync_status: data.sync_status as any,
      updated_at: sql`CURRENT_TIMESTAMP`,
    }).where(
      and(
        eq(hidrants.id, id),
        eq(hidrants.municipi, municipi)
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
  }
};
