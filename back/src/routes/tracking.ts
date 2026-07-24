import { db } from '../db/index.js';
import { ubicacions } from '../db/schema.js';
import type { ApiHandler } from '../types.js';
import { desc, eq, and, gte, sql } from 'drizzle-orm';

const handler: ApiHandler = async (req, res) => {
  const { method, query } = req;

  if (method === 'GET') {
    const latest = query?.latest === 'true';

    if (latest) {
      try {
        // Obtenir darrera posició per cada topic (usuari/dispositiu)
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

        return res.status(200).json(results);
      } catch (error) {
        console.error('[API Tracking] Error consultant darreres ubicacions:', error);
        return res.status(500).json({ error: 'Error consultant darreres ubicacions' });
      }
    }

    // Paràmetres opcionals
    const tracker_id = query?.tracker as string | undefined;
    const hours = query?.hours ? parseInt(query.hours as string) : 24; // Per defecte últimes 24h
    const limit = query?.limit ? parseInt(query.limit as string) : 100; // Per defecte 100 resultats

    // Calcular timestamp mínim (últimes X hores)
    const minTimestamp = Math.floor(Date.now() / 1000) - (hours * 3600);

    try {
      // Construir query
      const conditions = [gte(ubicacions.timestamp, minTimestamp)];
      
      if (tracker_id) {
        conditions.push(eq(ubicacions.tracker_id, tracker_id));
      }

      const results = await db
        .select()
        .from(ubicacions)
        .where(and(...conditions))
        .orderBy(desc(ubicacions.timestamp))
        .limit(limit);

      return res.status(200).json(results);
    } catch (error) {
      console.error('[API Tracking] Error consultant ubicacions:', error);
      return res.status(500).json({ error: 'Error consultant ubicacions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
