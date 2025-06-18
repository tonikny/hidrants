export default async function handler(req, res) {
  // Permetre CORS per a qualsevol origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Atendre la preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Només POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Processa la petició POST aquí

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// export default async function handler(req, res) {
//   // Permetre CORS
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   //   if (req.method === 'OPTIONS') {
//   //     // Resposta a preflight
//   //     res.status(204).end();
//   //     return;
//   //   }

//   if (req.method !== 'POST') {
//     res.status(405).json({ error: 'Method not allowed' });
//     return;
//   }

//   try {
//     const { lat, lon, tags, message } = req.body;
//     const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
//     const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

//     if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
//       return res.status(500).json({ error: 'Missing environment variables' });
//     }

//     const text = `
// 🗺️ Nova entrada OSM:
// 📍 Lat: ${lat}, Lon: ${lon}
// 🏷️ Tags: ${JSON.stringify(tags, null, 2)}
// 💬 Missatge: ${message || '(cap)'}
//     `;

//     const response = await fetch(
//       `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
//       }
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       return res.status(500).json({ error: `Telegram error: ${errorText}` });
//     }

//     res.status(200).json({ ok: true });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// }
