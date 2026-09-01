import { db } from "../db/index.js";
import { adfs, hidrants } from "../db/schema.js";
import { eq, notInArray, and } from "drizzle-orm";
import { queryOverpass, type OsmElement } from "./overpass.js";
import { v4 as uuidv4 } from "uuid";
import { HidrantsRepository } from "../db/repositories/hidrantsRepository.js";
import { logInfo, logSuccess, logWarn, logError } from "../utils/logger.js";

/**
 * Sincronitza els hidrants d'una ADF des d'OpenStreetMap (Overpass).
 *
 * @param force Si és true, sobreescriu tot (comportament original).
 *              Si és false (per defecte), respecta els estats locals:
 *              - SYNCED → actualitza des d'OSM
 *              - PENDING_CREATE → no toca
 *              - PENDING_UPDATE/DELETE → no toca si local és més nou;
 *                sinó marca CONFLICT (no sobreescriure)
 *              - CONFLICT/ERROR/REVIEW → no toca
 */
export async function syncAdfFromOSM(adfId: number, force = false) {
  const startTime = Date.now();
  logInfo("OSM", "Iniciant pull sync per ADF", { adfId, force });

  const adf = db.select().from(adfs).where(eq(adfs.id, adfId)).get();

  if (!adf) {
    logError("OSM", "ADF no trobat", adfId.toString());
    throw new Error(`ADF ${adfId} not found in database.`);
  }

  logInfo("OSM", "Relacions OSM per ADF", {
    adfId,
    nom: adf.nom,
    osmRelations: JSON.parse(adf.osm_relations).length,
    relations: JSON.parse(adf.osm_relations),
  });

  const relations: string[] = JSON.parse(adf.osm_relations);
  let allElements: OsmElement[] = [];
  let successCount = 0;

  for (const rel of relations) {
    const osmId = rel.replace("R", "");
    const areaId = 3600000000 + Number(osmId);

    const query = `
      [out:json][timeout:90];
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
      console.error(
        `[OSM Sync] Error descarregant relació ${rel}: ${result.error || "Unknown error"}`,
      );
    }
  }

  if (relations.length > 0 && successCount === 0) {
    throw new Error(
      `Totes les consultes a Overpass han fallat per a l'ADF ${adf.nom}. S'atura la sincronització per evitar pèrdua de dades.`,
    );
  }

  // Eliminem duplicats per id de node d'OSM si n'hi ha
  const uniqueElements = Array.from(new Map(allElements.map((node) => [node.id, node])).values());

  console.log(
    `[OSM Sync] Rebuts ${uniqueElements.length} hidrants d'OSM (únics) per a ADF ${adfId} (force=${force})`,
  );

  const syncTimestamp = new Date().toISOString();

  let skippedCount = 0;
  let conflictCount = 0;

  db.transaction((tx) => {
    for (const node of uniqueElements) {
      // 1. Busquem si ja existeix per osm_id
      const existing = HidrantsRepository.findByOsmId(node.id);

      if (existing) {
        // Guardar les dades remotes d'OSM per al diff (per TOTS els estats amb coincidència OSM)
        HidrantsRepository.saveRemoteData(existing.id, node.lat, node.lon, node.tags || {});
      }

      if (existing && !force) {
        const status = existing.sync_status;

        // Si és SYNCED → actualitzar normalment (ciclo inferior)
        if (status === "SYNCED") {
          // cau al cicle inferior d'inserció/actualització
        } else {
          // Qualsevol altre estat local → no sobreescriure locals

          if (status === "PENDING_UPDATE" || status === "PENDING_DELETE") {
            // Comparar timestamps per decidir si hi ha conflicte
            const localTime = new Date(existing.updated_at || 0).getTime();
            const osmTime = new Date(node.timestamp || 0).getTime();

            if (osmTime > localTime) {
              // OSM és més nou → marcar CONFLICT (l'usuari ha de resoldre)
              console.log(
                `[OSM Sync] Hidrant OSM ${node.id}: OSM més nou (${node.timestamp}) que local (${existing.updated_at}). Marcant CONFLICT.`,
              );
              logWarn("OSM", "Conflicte detectat (OSM més nou)", {
                hydrantId: existing.id,
                osmId: node.id,
                osmVersion: node.version,
                localVersion: existing.osm_version,
                osmTimestamp: node.timestamp,
                localTimestamp: existing.updated_at,
              });
              HidrantsRepository.markConflict(existing.id, {
                localVersion: existing.osm_version,
                osmVersion: node.version,
                osmLat: node.lat,
                osmLon: node.lon,
                osmTags: node.tags,
                localLat: existing.lat,
                localLon: existing.lon,
                localTags: existing.osm_tags ? JSON.parse(existing.osm_tags) : {},
                diffFields: ["pull_sync_conflict"],
              });
              conflictCount++;
            } else {
              // Local és més nou o igual → saltar, mantenir estat local
              console.log(`[OSM Sync] Hidrant OSM ${node.id}: Local més nou o igual. Saltant.`);
              logInfo("OSM", "Saltant hidrant (local més nou)", {
                hydrantId: existing.id,
                osmId: node.id,
                osmVersion: node.version,
                localVersion: existing.osm_version,
              });
              skippedCount++;
            }
          } else {
            // PENDING_CREATE, CONFLICT, ERROR, REVIEW → saltar
            console.log(`[OSM Sync] Hidrant OSM ${node.id}: Estat local ${status}. Saltant.`);
            skippedCount++;
          }
          continue; // No processem aquest node
        }
      }

      // Per force=true, el remote ja es va guardar al principi
      // (si existing existeix, saveRemoteData ja s'ha cridat)

      const id = existing ? existing.id : uuidv4();

      tx.insert(hidrants)
        .values({
          id,
          osm_id: node.id,
          osm_version: node.version,
          adf_id: adfId,
          lat: node.lat,
          lon: node.lon,
          osm_tags: JSON.stringify(node.tags || {}),
          sync_status: "SYNCED",
          synced_at: syncTimestamp,
          updated_at: syncTimestamp,
        })
        .onConflictDoUpdate({
          target: hidrants.id,
          set: {
            osm_id: node.id,
            lat: node.lat,
            lon: node.lon,
            osm_version: node.version,
            osm_tags: JSON.stringify(node.tags || {}),
            sync_status: "SYNCED",
            synced_at: syncTimestamp,
            updated_at: syncTimestamp,
          },
        })
        .run();
    }

    // Neteja d'hidrants esborrats a OSM
    // NOMÉS esborrem si hem pogut consultar TOTES les relacions de l'ADF amb èxit
    if (successCount === relations.length) {
      const currentOsmIds = uniqueElements.map((n) => n.id);

      if (currentOsmIds.length > 0) {
        tx.delete(hidrants)
          .where(
            and(
              eq(hidrants.adf_id, adfId),
              eq(hidrants.sync_status, "SYNCED"),
              notInArray(hidrants.osm_id, currentOsmIds as number[]),
            ),
          )
          .run();

        logInfo("OSM", "Neteja d'hidrants esborrats a OSM", {
          adfId,
          syncedRelations: successCount,
          totalRelations: relations.length,
          currentOsmIds: currentOsmIds.length,
          cleanedIds: currentOsmIds,
        });
      } else {
        tx.delete(hidrants)
          .where(and(eq(hidrants.adf_id, adfId), eq(hidrants.sync_status, "SYNCED")))
          .run();
        logWarn("OSM", "Netejant tots els hidrants SYNCED (no hi ha IDs OSM)", { adfId });
      }
    } else {
      console.warn(
        `[OSM Sync] Atenció: S'han saltat algunes relacions per errors. No s'esborrarà cap hidrant de la BD per evitar pèrdues accidentals.`,
      );
      logWarn("OSM", "Saltant neteja per errors en relacions", {
        adfId,
        successCount,
        totalRelations: relations.length,
      });
    }
  });

  if (skippedCount > 0 || conflictCount > 0) {
    console.log(
      `[OSM Sync] Resum: ${skippedCount} saltsats (locals mantinguts), ${conflictCount} conflictes nous`,
    );
  }

  logSuccess("OSM", "Pull completat", {
    adfId,
    totalElements: allElements.length,
    skipped: skippedCount,
    conflicts: conflictCount,
    duration: Date.now() - startTime,
  });

  return { total: allElements.length, skipped: skippedCount, conflicts: conflictCount };
}
