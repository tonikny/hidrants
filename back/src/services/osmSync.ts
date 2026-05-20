import db from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OVERPASS_API_URL = process.env.OVERPASS_URL || 'https://overpass.kumi.systems/api/interpreter';

/**
 * Sincronitza els hidrants d'un municipi des d'OpenStreetMap (Overpass)
 * a la base de dades local SQLite.
 */
export async function syncMunicipiFromOSM(municipiSlug: string) {
  // 1. Obtenir info del municipi (relation ID) del catàleg
  const catalogPath = path.resolve(__dirname, '../../data/municipis_catalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error('Municipis catalog not found. Run generate:municipis first.');
  }
  
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const municipiInfo = catalog.find((m: any) => m.slug === municipiSlug);
  
  if (!municipiInfo) {
    throw new Error(`Municipi "${municipiSlug}" not found in catalog.`);
  }

  const relationId = municipiInfo.osmRelation.replace('R', '');
  const areaId = 3600000000 + Number(relationId);

  const query = `
    [out:json][timeout:60];
    area(${areaId})->.searchArea;
    (
      node(area.searchArea)["emergency"="fire_hydrant"];
      node(area.searchArea)["disused:emergency"="fire_hydrant"];
    );
    out center tags;
  `.trim();

  console.log(`[OSM Sync] Descarregant dades d'OSM per al municipi: ${municipiSlug}...`);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'HidrantsADF/1.0 (dalecanya@gmail.com)',
      },
      body: query,
    });

    if (!response.ok) {
      const text = await response.text();
      // ✅ Si l'API d'Overpass està saturada o dona timeout (504/429), no aturem el servidor.
      // Simplement continuem amb el que tinguem a la BD local.
      if (response.status === 504 || response.status === 429) {
        console.warn(`[OSM Sync] Error temporal d'Overpass (${response.status}). S'omet la sincronització per ara.`);
        return 0;
      }
      throw new Error(`Error de l'API Overpass (${response.status}): ${text}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    console.log(`[OSM Sync] Rebuts ${elements.length} hidrants d'OSM per a ${municipiSlug}`);

    // 2. Actualitzar la base de dades en una transacció
    const syncTimestamp = new Date().toISOString();

    const insertOrUpdate = db.prepare(`
      INSERT INTO hidrants (id, osm_id, municipi, lat, lon, osm_tags, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'SYNCED', ?)
      ON CONFLICT(id) DO UPDATE SET
        lat = excluded.lat,
        lon = excluded.lon,
        osm_tags = excluded.osm_tags,
        updated_at = excluded.updated_at
      WHERE sync_status = 'SYNCED'
    `);

    const transaction = db.transaction((nodes: any[]) => {
      for (const node of nodes) {
        const id = `osm-${node.id}`;
        insertOrUpdate.run(
          id,
          node.id,
          municipiSlug,
          node.lat,
          node.lon,
          JSON.stringify(node.tags || {}),
          syncTimestamp
        );
      }

      // 3. Gestionar eliminacions: esborrar nodes que eren SYNCED però ja no venen a la resposta d'OSM
      const currentOsmIds = nodes.map(n => n.id);
      if (currentOsmIds.length > 0) {
        // SQLite té un límit de paràmetres, així que si n'hi ha molts, ho fem per parts o amb una altra estratègia.
        // Per a hidrants municipals (solen ser < 500) això és segur.
        const placeholders = currentOsmIds.map(() => '?').join(',');
        const deleteStale = db.prepare(`
          DELETE FROM hidrants 
          WHERE municipi = ? 
          AND sync_status = 'SYNCED' 
          AND osm_id NOT IN (${placeholders})
        `);
        deleteStale.run(municipiSlug, ...currentOsmIds);
      } else {
        // Si OSM no ha retornat res, esborrem tots els SYNCED d'aquest municipi
        db.prepare(`DELETE FROM hidrants WHERE municipi = ? AND sync_status = 'SYNCED'`).run(municipiSlug);
      }
    });

    transaction(elements);
    
    console.log(`[OSM Sync] Sincronització completada per a ${municipiSlug}`);
    return elements.length;

  } catch (error) {
    console.error(`[OSM Sync] Error sincronitzant ${municipiSlug}:`, error);
    throw error;
  }
}
