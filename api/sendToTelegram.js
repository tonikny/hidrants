module.exports = async function handler(req, res) {
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
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      res.status(500).json({ error: 'Missing environment variables' });
      return;
    }

    const text = `
      ${tags ? '📝 Comentari del node:' : '🗺️ Nova entrada OSM:'}
      📍 Lat: ${lat}, Lon: ${lon}
      ${tags ? `🏷️ Tags: ${JSON.stringify(tags, null, 2)}` : null}
      💬 Missatge: ${message || '(cap)'}
    `;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      res.status(500).json({ error: `Telegram error: ${errorText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
