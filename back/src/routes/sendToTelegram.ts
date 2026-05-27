import type { ApiHandler } from '../types.js';
import { config } from '../config.js';
import { ui2Osm } from '../utils/osmConversion.js';

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

    let title = '🗺️ <b>Nou Hidrant:</b>';
    if (tags?.type === 'incidencia') {
      title = '⚠️ <b>Nova Incidència:</b>';
    } else if (tags?.osm_id || tags?.id) {
      title = '📝 <b>Comentari de l\'hidrant:</b>';
    }

    const osmId = tags?.osm_id;

    // Preparem una còpia neta per Telegram amb la info de la BD
    const dbInfo = { ...tags };
    
    // Si ens arriben ui_fields (formulari), els convertim a tags d'OSM (pel cas de nous nodes)
    // però sempre els eliminem del JSON final del missatge per no duplicar
    if (dbInfo.ui_fields) {
      if (!dbInfo.osm_tags || Object.keys(dbInfo.osm_tags).length === 0) {
        dbInfo.osm_tags = ui2Osm(dbInfo.ui_fields);
      }
      delete dbInfo.ui_fields;
    }

    const text = `
${title}

📍 Coord: <code>${lat}, ${lon}</code>
💬 Missatge: ${message || '(cap)'}

🏷️ <b>Info BD:</b>
<pre>${JSON.stringify(dbInfo, null, 2)}</pre>

${
  osmId && tags?.type !== 'incidencia'
    ? `🔗 https://www.openstreetmap.org/node/${osmId}`
    : ''
}
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
