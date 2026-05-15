import fs from 'fs';
import path from 'path';
import { ApiHandler } from '../types.js';

const municipi: ApiHandler = async (req, res) => {
  try {
    const catalogPath = path.resolve(import.meta.dirname, '../../data/municipis_catalog.json');
    
    if (!fs.existsSync(catalogPath)) {
      return res.status(500).json({ error: 'Municipis catalog not found' });
    }

    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    
    // req.municipi és extret pel middleware a server.ts basant-se en el subdomini
    const data = catalog.find((m: any) => m.slug === req.municipi);

    // Si no es troba, retornem null tal com s'ha demanat
    res.json(data || null);
  } catch (error) {
    console.error('Error in /api/municipi:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default municipi;
