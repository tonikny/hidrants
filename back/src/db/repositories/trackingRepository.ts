import { db } from '../index.js';
import { ubicacions } from '../schema.js';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export interface UbicacioData {
  id: string;
  topic: string;
  tracker_id: string | null;
  lat: number;
  lon: number;
  timestamp: number;
  accuracy: number | null;
  altitude: number | null;
  battery: number | null;
  velocity: number | null;
  trigger: string | null;
  connection: string | null;
  created_at?: string | null;
}

export const TrackingRepository = {
  async insert(data: UbicacioData): Promise<void> {
    await db.insert(ubicacions).values(data);
  },

  async getLatestByTopic(): Promise<UbicacioData[]> {
    const subquery = db
      .select({
        id: ubicacions.id,
        topic: ubicacions.topic,
        tracker_id: ubicacions.tracker_id,
        lat: ubicacions.lat,
        lon: ubicacions.lon,
        timestamp: ubicacions.timestamp,
        accuracy: ubicacions.accuracy,
        altitude: ubicacions.altitude,
        battery: ubicacions.battery,
        velocity: ubicacions.velocity,
        trigger: ubicacions.trigger,
        connection: ubicacions.connection,
        created_at: ubicacions.created_at,
        rn: sql`row_number() over (partition by ${ubicacions.topic} order by ${ubicacions.timestamp} desc)`.as('rn'),
      })
      .from(ubicacions)
      .as('sq');

    const results = await db
      .select({
        id: subquery.id,
        topic: subquery.topic,
        tracker_id: subquery.tracker_id,
        lat: subquery.lat,
        lon: subquery.lon,
        timestamp: subquery.timestamp,
        accuracy: subquery.accuracy,
        altitude: subquery.altitude,
        battery: subquery.battery,
        velocity: subquery.velocity,
        trigger: subquery.trigger,
        connection: subquery.connection,
        created_at: subquery.created_at,
      })
      .from(subquery)
      .where(eq(subquery.rn, 1));

    return results as UbicacioData[];
  },

  async getHistory(options: { tracker_id?: string; minTimestamp: number; limit: number }): Promise<UbicacioData[]> {
    const conditions = [gte(ubicacions.timestamp, options.minTimestamp)];
    
    if (options.tracker_id) {
      conditions.push(eq(ubicacions.tracker_id, options.tracker_id));
    }

    const results = await db
      .select()
      .from(ubicacions)
      .where(and(...conditions))
      .orderBy(desc(ubicacions.timestamp))
      .limit(options.limit);

    return results as UbicacioData[];
  }
};
