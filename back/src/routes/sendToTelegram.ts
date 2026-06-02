import type { ApiHandler } from '../types.js';
import { ui2Osm } from '../utils/osmConversion.js';
import { HidrantsService } from '../services/hidrantsService.js';
import { sendTelegramMessage } from '../utils/telegram.js';

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
    const { lat, lon, tags, message, adf_id } = req.body;

    let title = '🗺️ <b>Nou Hidrant:</b>';
    let isNewHydrant = false;

    if (tags?.type === 'incidencia') {
      title = '⚠️ <b>Nova Incidència:</b>';
    } else if (tags?.osm_id || tags?.id) {
      title = '📝 <b>Comentari de l\'hidrant:</b>';
    } else {
      isNewHydrant = true;
    }

    // Si és un nou hidrant i tenim adf_id, el guardem a la BD
    let dbResult = null;
    if (isNewHydrant && adf_id) {
      try {
        dbResult = HidrantsService.createLocal(
          Number(adf_id),
          lat,
          lon,
          tags?.ui_fields,
          {}
        );
      } catch (dbErr) {
        console.error('Error saving to DB:', dbErr);
      }
    }

    const osmId = tags?.osm_id;

    // Preparem una còpia neta per Telegram amb la info de la BD
    const dbInfo = { ...tags };
    if (dbResult) {
      dbInfo.id = dbResult.id;
      dbInfo.sync_status = dbResult.sync_status;
    }
    
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

    await sendTelegramMessage(text);
    res.status(200).json({ ok: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: (error as Error).message || 'Unexpected error' });
  }
};

export default handler;
