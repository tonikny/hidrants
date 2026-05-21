import fs from 'fs';
import path from 'path';
import { ApiHandler } from '../types.js';

const municipis: ApiHandler = async (req, res) => {
  try {
    const catalogPath = path.resolve(import.meta.dirname, '../../data/municipis_catalog.json');
    
    if (!fs.existsSync(catalogPath)) {
      return res.status(500).json({ error: 'Municipis catalog not found' });
    }

    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    res.json(catalog);
  } catch (error) {
    console.error('Error in /api/municipis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default municipis;
