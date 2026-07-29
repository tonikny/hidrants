import type { ApiHandler } from '../types.js';
import { config } from '../config.js';

const handler: ApiHandler = async (req, res) => {
  try {
    const { from, to } = req.query;
    const apiKey = config.GRAPHHOPPER_API_KEY;

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "Missing 'from' or 'to' query params" });
    }

    const url = `https://graphhopper.com/api/1/route?point=${from}&point=${to}&vehicle=car&points_encoded=false&locale=en&key=${apiKey}`;

    console.log('Requesting:', url);

    const r = await fetch(url);
    const text = await r.text(); // get text first

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (e) {
      console.error('GraphHopper response was not JSON:\n', text);
      return res
        .status(502)
        .json({ error: 'Invalid response from GraphHopper', raw: text });
    }
  } catch (err) {
    console.error('Routing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export default handler;
