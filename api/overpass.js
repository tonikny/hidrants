module.exports = async function handler(req, res) {
  const OVERPASS_URL =
    process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

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

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'User-Agent': 'HidrantsADF/1.0 (dalecanya@gmail.com)',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: query.trim(),
    });

    const text = await response.text();

    if (!response.ok) {
      res.status(response.status).json({
        error: 'Overpass error',
        details: text,
      });
      return;
    }

    // Overpass retorna JSON com a string
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Unexpected error',
    });
  }
};
