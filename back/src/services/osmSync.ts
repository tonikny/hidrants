import { db } from '../db/index.js';
import { adfs, hidrants } from '../db/schema.js';
import { eq, notInArray, and } from 'drizzle-orm';
import { queryOverpass, type OsmElement } from './overpass.js';
import { v4 as uuidv4 } from 'uuid';
import { HidrantsRepository } from '../db/repositories/hidrantsRepository.js';

/**
 * Sincronitza els hidrants d'una ADF des d'OpenStreetMap (Overpass)
 */
export async function syncAdfFromOSM(adfId: number) {
  const adf = db.select().from(adfs).where(eq(adfs.id, adfId)).get();

  if (!adf) {
    throw new Error(`ADF ${adfId} not found in database.`);
  }

  const relations: string[] = JSON.parse(adf.osm_relations);
  let allElements: OsmElement[] = [];
  let successCount = 0;

  for (const rel of relations) {
    const osmId = rel.replace('R', '');
    const areaId = 3600000000 + Number(osmId);

    const query = `
      [out:json][timeout:60];
      area(${areaId})->.searchArea;
      (
        node(area.searchArea)["emergency"="fire_hydrant"];
        node(area.searchArea)["disused:emergency"="fire_hydrant"];
      );
      out meta;
    `.trim();

    console.log(`[OSM Sync] Descarregant dades d'OSM per a relació ${rel}...`);
    const result = await queryOverpass(query);

    if (result.ok) {
      successCount++;
      allElements = [...allElements, ...(result.data.elements || [])];
    } else {
      console.error(`[OSM Sync] Error descarregant relació ${rel}: ${result.error || 'Unknown error'}`);
    }
  }

  if (relations.length > 0 && successCount === 0) {
    throw new Error(`Totes les consultes a Overpass han fallat per a l'ADF ${adf.nom}. S'atura la sincronització per evitar pèrdua de dades.`);
  }

  // Eliminem duplicats per id de node d'OSM si n'hi ha
  const uniqueElements = Array.from(new Map(allElements.map(node => [node.id, node])).values());

  console.log(`[OSM Sync] Rebuts ${uniqueElements.length} hidrants d'OSM (únics) per a ADF ${adfId}`);

  const syncTimestamp = new Date().toISOString();

  db.transaction((tx) => {
    for (const node of uniqueElements) {
      // 1. Busquem si ja existeix per osm_id
      let existing = HidrantsRepository.findByOsmId(node.id);
      
      // 2. Si no existeix per osm_id, mirem si tenim un PENDING_CREATE a prop (3m)
      if (!existing) {
        existing = HidrantsRepository.findNearbyPending(node.lat, node.lon, adfId);
        if (existing) {
          console.log(`[OSM Sync] Fusionant hidrant local ${existing.id} amb el nou node d'OSM ${node.id}`);
        }
      }

      // 3. Comparació de dates si existeix
      let skipUpdate = false;
      if (existing && (existing.sync_status === 'PENDING_UPDATE' || existing.sync_status === 'PENDING_DELETE')) {
        const localTime = new Date(existing.updated_at || 0).getTime();
        const osmTime = new Date(node.timestamp || 0).getTime();

        if (osmTime > localTime) {
          console.log(`[OSM Sync] Hidrant ${node.id}: OSM té dades més recents (${node.timestamp}) que la BD local (${existing.updated_at}). Sincronitzant.`);
        } else if (osmTime < localTime) {
          console.log(`[OSM Sync] Hidrant ${node.id}: La BD local té canvis més recents (${existing.updated_at}) que OSM (${node.timestamp}). Es manté l'estat PENDING.`);
          skipUpdate = true;
        }
      }

      if (skipUpdate) {continue;}

      const id = existing ? existing.id : uuidv4();

      tx.insert(hidrants).values({
        id,
        osm_id: node.id,
        osm_version: node.version,
        adf_id: adfId,
        lat: node.lat,
        lon: node.lon,
        osm_tags: JSON.stringify(node.tags || {}),
        sync_status: 'SYNCED',
        updated_at: syncTimestamp
      }).onConflictDoUpdate({
        target: hidrants.id,
        set: {
          osm_id: node.id,
          lat: node.lat,
          lon: node.lon,
          osm_version: node.version,
          osm_tags: JSON.stringify(node.tags || {}),
          sync_status: 'SYNCED',
          updated_at: syncTimestamp
        }
      }).run();
    }

    // 4. Neteja d'hidrants esborrats a OSM
    // NOMÉS esborrem si hem pogut consultar TOTES les relacions de l'ADF amb èxit
    if (successCount === relations.length) {
      const currentOsmIds = uniqueElements.map((n) => n.id);
      
      if (currentOsmIds.length > 0) {
        tx.delete(hidrants).where(
          and(
            eq(hidrants.adf_id, adfId),
            eq(hidrants.sync_status, 'SYNCED'),
            notInArray(hidrants.osm_id, currentOsmIds as number[])
          )
        ).run();
      } else {
        tx.delete(hidrants).where(
          and(
            eq(hidrants.adf_id, adfId),
            eq(hidrants.sync_status, 'SYNCED')
          )
        ).run();
      }
    } else {
      console.warn(`[OSM Sync] Atenció: S'han saltat algunes relacions per errors. No s'esborrarà cap hidrant de la BD per evitar pèrdues accidentals.`);
    }
  });

  return allElements.length;
}
