import fs from 'fs';
import path from 'path';
import { ApiHandler } from '../types.js';

const boundary: ApiHandler = async (req, res) => {
  try {
    if (!req.municipi) {
      return res.status(400).json({ error: 'No municipi detected' });
    }

    const boundaryPath = path.resolve(
      import.meta.dirname,
      `../../data/boundaries/${req.municipi}.geojson`
    );

    if (!fs.existsSync(boundaryPath)) {
      console.warn(`⚠️ Boundary file not found for: ${req.municipi}`);
      return res.status(404).json({ error: 'Boundary not found' });
    }

    const data = JSON.parse(fs.readFileSync(boundaryPath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error in /api/municipi/boundary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default boundary;
