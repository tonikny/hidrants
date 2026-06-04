import { db } from '../db/index.js';
import { adfs, hidrants } from '../db/schema.js';
import { eq, notInArray, and } from 'drizzle-orm';
import { queryOverpass } from './overpass.js';
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
  let allElements: any[] = [];

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
      allElements = [...allElements, ...(result.data.elements || [])];
    }
  }

  // Eliminem duplicats per id de node d'OSM si n'hi ha
  const uniqueElements = Array.from(new Map(allElements.map(node => [node.id, node])).values());

  console.log(`[OSM Sync] Rebuts ${uniqueElements.length} hidrants d'OSM (únics) per a ADF ${adfId}`);

  const syncTimestamp = new Date().toISOString();

  db.transaction((tx) => {
    for (const node of uniqueElements) {
      // Busquem si ja existeix per osm_id
      const existing = HidrantsRepository.findByOsmId(node.id);
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
          lat: node.lat,
          lon: node.lon,
          osm_version: node.version,
          osm_tags: JSON.stringify(node.tags || {}),
          updated_at: syncTimestamp
        },
        where: eq(hidrants.sync_status, 'SYNCED')
      }).run();
    }

    const currentOsmIds = uniqueElements.map((n: any) => n.id);
    
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
  });

  return allElements.length;
}
