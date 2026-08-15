import { HidrantsRepository, type HidrantData } from "../db/repositories/hidrantsRepository.js";
import * as osmApi from "./osmApi.js";
import { sendTelegramMessage } from "../utils/telegram.js";
import { tryAutoResolve, type ConflictDetail } from "./osmConflictResolver.js";
import { validateHydrantTags } from "./osmDataValidator.js";
import { computeDiffStrings } from "./osmDiff.js";

export type PushSyncResult = {
  synced: number;
  conflicts: number;
  errors: number;
  reviewed: number;
  details: Array<{
    id: string;
    osmId: number | null;
    status: "synced" | "conflict" | "error" | "review";
    message?: string;
  }>;
};

export function parseOsmTags(osmTags: string | null | undefined): Record<string, string> {
  try {
    return JSON.parse(osmTags || "{}");
  } catch {
    return {};
  }
}

/**
 * Sincronitzar els canvis pendents de la BD cap a OSM (push sync).
 *
 * FLUX:
 * 1. Obtenir hidrants PENDING_CREATE / PENDING_UPDATE / PENDING_DELETE
 * 2. Crear un únic changeset
 * 3. Per cada hidrant, intentar publicar amb la seva osm_version
 * 4. Si 200 → SYNCED + actualitzar osm_version
 * 5. Si 409 → CONFLICT (guardar detalls per al .osc)
 * 6. Tancar changeset
 * 7. Notificar a l'admin via Telegram si hi ha conflictes
 */
export async function pushSyncToOSM(options?: {
  ids?: string[];
  adfId?: number;
}): Promise<PushSyncResult> {
  if (!osmApi.isConfigured()) {
    throw new Error("Token OSM no configurat. Afegeix OSM_ACCESS_TOKEN a back/.env");
  }

  let pending: HidrantData[];

  if (options?.ids && options.ids.length > 0) {
    // Push selectiu: només els IDs especificats
    pending = HidrantsRepository.findByIds(options.ids).filter(
      (h) =>
        h.sync_status === "PENDING_CREATE" ||
        h.sync_status === "PENDING_UPDATE" ||
        h.sync_status === "PENDING_DELETE",
    );
  } else {
    // Push global: tots els pending
    pending = HidrantsRepository.findBySyncStatus([
      "PENDING_CREATE",
      "PENDING_UPDATE",
      "PENDING_DELETE",
    ]);
    // Filtrar per ADF si es demana
    if (options?.adfId) {
      pending = pending.filter((h) => h.adf_id === options.adfId);
    }
  }

  if (pending.length === 0) {
    return { synced: 0, conflicts: 0, errors: 0, reviewed: 0, details: [] };
  }

  console.log(`[OSM Push] ${pending.length} canvis pendents de pujar`);

  // Crear changeset
  const changesetId = await osmApi.createChangeset(
    `HidrantsADF — ${pending.length} canvis pendents`,
  );
  console.log(`[OSM Push] Changeset ${changesetId} creat`);

  const result: PushSyncResult = { synced: 0, conflicts: 0, errors: 0, reviewed: 0, details: [] };
  const conflictDetails: ConflictDetail[] = [];

  for (const h of pending) {
    try {
      if (h.sync_status === "PENDING_CREATE") {
        await processCreate(h, changesetId, result);
      } else if (h.sync_status === "PENDING_UPDATE") {
        await processUpdate(h, changesetId, result, conflictDetails);
      } else if (h.sync_status === "PENDING_DELETE") {
        await processDelete(h, changesetId, result, conflictDetails);
      }
    } catch (err) {
      console.error(`[OSM Push] Error processant hidrant ${h.id}:`, err);
      HidrantsRepository.markError(h.id, String(err));
      result.errors++;
      result.details.push({
        id: h.id,
        osmId: h.osm_id ?? null,
        status: "error",
        message: String(err),
      });
    }
  }

  // Tancar changeset
  await osmApi.closeChangeset(changesetId);
  console.log(`[OSM Push] Changeset ${changesetId} tancat`);

  // Notificar conflictes per Telegram
  if (conflictDetails.length > 0) {
    await notifyConflicts(conflictDetails);
  }

  console.log(
    `[OSM Push] Resum: ${result.synced} sincronitzats, ${result.conflicts} conflictes, ${result.reviewed} revisió, ${result.errors} errors`,
  );

  return result;
}

// --- Processament individual ---

async function processCreate(h: HidrantData, changesetId: number, result: PushSyncResult) {
  const tags = parseOsmTags(h.osm_tags);

  // Validar dades abans de pujar
  const validation = validateHydrantTags(tags);
  if (!validation.valid) {
    HidrantsRepository.markError(
      h.id,
      `Dades invàlides: ${validation.issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")}`,
    );
    result.errors++;
    result.details.push({ id: h.id, osmId: null, status: "error", message: "Dades invàlides" });
    return;
  }
  if (validation.issues.length > 0) {
    HidrantsRepository.markReview(h.id, validation.issues);
    result.reviewed++;
    result.details.push({
      id: h.id,
      osmId: null,
      status: "review",
      message: `Warnings: ${validation.issues.map((i) => i.message).join("; ")}`,
    });
    return;
  }

  try {
    const { osmId, newVersion } = await osmApi.createNode(h.lat, h.lon, tags, changesetId);
    HidrantsRepository.markSynced(h.id, newVersion, osmId);
    // Guardar les dades que hem pujat com a remote (per al futur diff)
    HidrantsRepository.saveRemoteData(h.id, h.lat, h.lon, tags);
    result.synced++;
    result.details.push({ id: h.id, osmId, status: "synced" });
  } catch (err) {
    HidrantsRepository.markError(h.id, String(err));
    result.errors++;
    result.details.push({ id: h.id, osmId: null, status: "error", message: String(err) });
  }
}

async function processUpdate(
  h: HidrantData,
  changesetId: number,
  result: PushSyncResult,
  conflictDetails: ConflictDetail[],
) {
  if (!h.osm_id || !h.osm_version) {
    HidrantsRepository.markError(h.id, "osm_id o osm_version no definits");
    result.errors++;
    result.details.push({
      id: h.id,
      osmId: h.osm_id ?? null,
      status: "error",
      message: "Sense osm_id o osm_version",
    });
    return;
  }

  const osmId = h.osm_id;
  const osmVersion = h.osm_version;
  const tags = parseOsmTags(h.osm_tags);

  // Validar dades abans de pujar
  const validation = validateHydrantTags(tags);
  if (!validation.valid) {
    HidrantsRepository.markError(
      h.id,
      `Dades invàlides: ${validation.issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")}`,
    );
    result.errors++;
    result.details.push({ id: h.id, osmId, status: "error", message: "Dades invàlides" });
    return;
  }
  if (validation.issues.length > 0) {
    HidrantsRepository.markReview(h.id, validation.issues);
    result.reviewed++;
    result.details.push({
      id: h.id,
      osmId,
      status: "review",
      message: `Warnings: ${validation.issues.map((i) => i.message).join("; ")}`,
    });
    return;
  }

  const r = await osmApi.updateNode(osmId, osmVersion, h.lat, h.lon, tags, changesetId);

  if (r.ok) {
    const newVersion = Number(r.data) || osmVersion + 1;
    HidrantsRepository.markSynced(h.id, newVersion);
    // Guardar les dades que hem pujat com a remote (per al futur diff)
    HidrantsRepository.saveRemoteData(h.id, h.lat, h.lon, tags);
    result.synced++;
    result.details.push({ id: h.id, osmId, status: "synced" });
  } else if (r.status === 400) {
    HidrantsRepository.markError(h.id, r.error);
    result.errors++;
    result.details.push({ id: h.id, osmId, status: "error", message: r.error });
  } else if ("osmVersion" in r) {
    // 409 — Conflicte de versió
    const diffFields = computeDiffStrings(h.lat, h.lon, tags, r.osmLat, r.osmLon, r.osmTags);
    const errorDetails = {
      localVersion: osmVersion,
      osmVersion: r.osmVersion,
      osmLat: r.osmLat,
      osmLon: r.osmLon,
      osmTags: r.osmTags,
      localLat: h.lat,
      localLon: h.lon,
      localTags: tags,
      diffFields,
    };

    // Guardar les dades remotes per al diff
    HidrantsRepository.saveRemoteData(h.id, r.osmLat, r.osmLon, r.osmTags);

    // Intentar merge automàtic
    const autoMerged = await tryAutoResolve(h);

    if (autoMerged) {
      result.synced++;
      result.details.push({ id: h.id, osmId, status: "synced", message: "Resolt automàticament" });
    } else {
      HidrantsRepository.markConflict(h.id, errorDetails);
      conflictDetails.push({
        hidrant: h,
        osmVersion: r.osmVersion,
        osmLat: r.osmLat,
        osmLon: r.osmLon,
        osmTags: r.osmTags,
        diffFields,
      });
      result.conflicts++;
      result.details.push({
        id: h.id,
        osmId: h.osm_id,
        status: "conflict",
        message: `Diferències: ${diffFields.join(", ")}`,
      });
    }
  } else {
    HidrantsRepository.markError(h.id, r.error);
    result.errors++;
    result.details.push({ id: h.id, osmId: h.osm_id, status: "error", message: r.error });
  }
}

async function processDelete(
  h: HidrantData,
  changesetId: number,
  result: PushSyncResult,
  conflictDetails: ConflictDetail[],
) {
  if (!h.osm_id || !h.osm_version) {
    // Node mai publicat a OSM — esborrar directament de la BD
    HidrantsRepository.delete(h.id);
    result.synced++;
    result.details.push({
      id: h.id,
      osmId: null,
      status: "synced",
      message: "Esborrat localment (mai publicat)",
    });
    return;
  }

  const osmId = h.osm_id;
  const osmVersion = h.osm_version;
  const r = await osmApi.deleteNode(osmId, osmVersion, changesetId);

  if (r.ok) {
    HidrantsRepository.delete(h.id);
    result.synced++;
    result.details.push({ id: h.id, osmId, status: "synced", message: "Esborrat d'OSM" });
  } else if ("osmVersion" in r) {
    // 409 — algú ha canviat el node abans d'esborrar-lo
    const diffFields = computeDiffStrings(
      h.lat,
      h.lon,
      parseOsmTags(h.osm_tags),
      r.osmLat,
      r.osmLon,
      r.osmTags,
    );

    // Guardar les dades remotes per al diff
    HidrantsRepository.saveRemoteData(h.id, r.osmLat, r.osmLon, r.osmTags);

    HidrantsRepository.markConflict(h.id, {
      localVersion: osmVersion,
      osmVersion: r.osmVersion,
      osmLat: r.osmLat,
      osmLon: r.osmLon,
      osmTags: r.osmTags,
      localLat: h.lat,
      localLon: h.lon,
      localTags: parseOsmTags(h.osm_tags),
      diffFields,
    });
    conflictDetails.push({
      hidrant: h,
      osmVersion: r.osmVersion,
      osmLat: r.osmLat,
      osmLon: r.osmLon,
      osmTags: r.osmTags,
      diffFields,
    });
    result.conflicts++;
    result.details.push({
      id: h.id,
      osmId,
      status: "conflict",
      message: `Diferències: ${diffFields.join(", ")}`,
    });
  } else {
    HidrantsRepository.markError(h.id, r.error);
    result.errors++;
    result.details.push({ id: h.id, osmId, status: "error", message: r.error });
  }
}

// --- Helpers ---

async function notifyConflicts(conflicts: ConflictDetail[]) {
  let msg = `⚠️ <b>Conflictes OSM detectats</b> (${conflicts.length})\n\n`;

  for (const c of conflicts) {
    const h = c.hidrant;
    const label = h.osm_id ? `OSM ${h.osm_id}` : h.id;
    msg += `• <b>Hidrant ${label}</b>\n`;
    msg += `  Diferències: ${c.diffFields.join(", ")}\n`;
    msg += `  Versió local: ${h.osm_version}, Versió OSM: ${c.osmVersion}\n\n`;
  }

  msg += `Resol-los a l'administració o descarrega el fitxer .osc`;

  await sendTelegramMessage(msg);
}
