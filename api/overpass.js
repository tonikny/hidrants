module.exports = async function handler(req, res) {
    const OVERPASS_URL =
        process.env.OVERPASS_URL ||
        'https://overpass-api.de/api/interpreter';

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
            res.status(400).json({ error: 'Missing Overpass query' });
            return;
        }

        const response = await fetch(
            OVERPASS_URL,
            {
                method: 'POST',
                headers: {
                    // evita headers que poden provocar 406
                    'Content-Type': 'text/plain;charset=UTF-8',
                },
                body: query,
            }
        );

        const text = await response.text();

        if (!response.ok) {
            res.status(response.status).json({
                error: 'Overpass error',
                details: text,
            });
            return;
        }

        // Overpass retorna JSON string
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(text);
    } catch (error) {
        res.status(500).json({
            error: error.message || 'Unexpected error',
        });
    }
};