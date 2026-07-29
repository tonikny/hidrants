import type { ApiHandler } from '../types.js';
import { queryOverpass } from '../services/overpass.js';

const handler: ApiHandler = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

    const result = await queryOverpass(query.trim().replace(/\r/g, ''));

    if (!result.ok) {
      res.status(result.status || 500).json({
        error: 'Overpass error',
        details: result.error,
      });
      return;
    }

    // Overpass retorna JSON
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({
      error: (err as Error).message || 'Unexpected error',
    });
  }
};

export default handler;
