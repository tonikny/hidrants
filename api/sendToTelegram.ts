export default async function handler(req, res) {
  // Permetre CORS per qualsevol origen (en prod, limita-ho)
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Preflight request per CORS
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { lat, lon, tags, message } = req.body;

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const text = `
🗺️ Nova entrada OSM:
📍 Lat: ${lat}, Lon: ${lon}
🏷️ Tags: ${JSON.stringify(tags, null, 2)}
💬 Missatge: ${message || '(cap)'}
  `;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  });

  if (!response.ok) {
    return res.status(500).json({ error: 'Telegram error' });
  }

  res.status(200).json({ ok: true });
}
