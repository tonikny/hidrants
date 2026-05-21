import type { ApiHandler } from '../types.js';
import { config } from '../config.js';

const handler: ApiHandler = async (req, res) => {
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
    const { lat, lon, tags, message } = req.body;
    const TELEGRAM_BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = config.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      res.status(500).json({ error: 'Missing environment variables' });
      return;
    }

    const text = `
${tags?.id ? '📝 <b>Comentari del node:</b>' : '🗺️ <b>Nova entrada OSM:</b>'}

📍 Coord: <pre>${lat}, ${lon}</pre>
💬 Missatge: ${message || '(cap)'}
${tags ? `🏷️ Tags: <pre>${JSON.stringify(tags, null, 2)}</pre>` : ''}
${tags?.id ? `https://www.openstreetmap.org/${tags.id}` : ''}
    `;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      res.status(500).json({ error: `Telegram error: ${errorText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: (error as Error).message || 'Unexpected error' });
  }
};

export default handler;
