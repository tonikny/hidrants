import type { ApiHandler } from '../types.js';
import { ui2Osm } from '../utils/osmConversion.js';
import { HidrantsService } from '../services/hidrantsService.js';
import { sendTelegramMessage } from '../utils/telegram.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const { lat, lon, tags, message, adf_id, isEdit } = req.body;

    let title = '🗺️ <b>Nou Hidrant:</b>';
    let isNewHydrant = false;

    if (tags?.type === 'incidencia') {
      title = '⚠️ <b>Nova Incidència:</b>';
    } else if (tags?.osm_id || tags?.id) {
      // Diferenciar entre edició i comentari
      title = isEdit
        ? "✏️ <b>Edició d'hidrant:</b>"
        : "💬 <b>Comentari de l'hidrant:</b>";
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
          tags?.private_tags || {}
        );
      } catch (dbErr) {
        console.error('Error saving to DB:', dbErr);
      }
    }

    // Preparem una còpia neta per Telegram amb la info de la BD
    const dbInfo = { ...tags };
    if (dbResult) {
      dbInfo.id = dbResult.id;
      dbInfo.sync_status = dbResult.sync_status;
    }

    if (dbInfo.ui_fields) {
      const currentOsmTags = { ...(dbInfo.osm_tags || {}) };
      const newOsmTags = ui2Osm(dbInfo.ui_fields);
      if (dbInfo.ui_fields.estat) {
        delete currentOsmTags['emergency'];
        delete currentOsmTags['disused:emergency'];
      }
      dbInfo.osm_tags = { ...currentOsmTags, ...newOsmTags };
      delete dbInfo.ui_fields;
    }

    // Generar URL de l'aplicació dinàmicament utilitzant les capçaleres de la petició
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'hidrants.adfcongost.cat';
    const nodeId = tags?.id || dbResult?.id;
    const adfParam = adf_id ? `adf=${adf_id}&` : '';
    const appUrl = nodeId
      ? `${protocol}://${host}/?${adfParam}node=${nodeId}`
      : null;

    // Extreure observacions de private_tags
    const observacions = tags?.private_tags?.observacions || '';

    const text = `
${title}

${appUrl ? `📍 <a href="${appUrl}">Veure a l'aplicació</a>` : ''}
📍 Coord: <code>${lat}, ${lon}</code>
💬 Missatge: ${escapeHtml(message || '(cap)')}

🏷️ <b>Info BD:</b>
<pre>${escapeHtml(JSON.stringify(dbInfo, null, 2))}</pre>
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
