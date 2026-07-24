import { TrackingService } from '../services/trackingService.js';
import type { ApiHandler } from '../types.js';

const handler: ApiHandler = async (req, res) => {
  const { method, query } = req;

  if (method === 'GET') {
    const latest = query?.latest === 'true';

    try {
      if (latest) {
        const results = await TrackingService.getLatest();
        return res.status(200).json(results);
      }

      const tracker_id = query?.tracker as string | undefined;
      const hours = query?.hours ? parseInt(query.hours as string) : 24;
      const limit = query?.limit ? parseInt(query.limit as string) : 100;

      const results = await TrackingService.getHistory({ tracker_id, hours, limit });
      return res.status(200).json(results);
    } catch (error) {
      console.error('[API Tracking] Error:', error);
      return res.status(500).json({ error: 'Error consultant tracking' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

export default handler;
