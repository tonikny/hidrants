import type { ApiHandler } from "../types.js";
import { pushSyncToOSM } from "../services/osmPushSync.js";
import {
  getConflicts,
  resolveAfterJOSM,
  generateOscFile,
} from "../services/osmConflictResolver.js";
import { isConfigured } from "../services/osmApi.js";
import { HidrantsRepository } from "../db/repositories/hidrantsRepository.js";
import { BadRequestError } from "../errors.js";
import { db } from "../db/index.js";
import { hidrants } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Rutes OSM:
 *
 * GET  /api/osm/status         → estat del token i comptador de conflictes
 * GET  /api/osm/pending?adf=ID → llistat de canvis pendents per ADF
 * POST /api/osm/push-sync      → pujar tots els canvis pendents a OSM
 * POST /api/osm/push-selected  → pujar només els hidrants seleccionats
 * POST /api/osm/discard-selected → descartar canvis seleccionats
 * GET  /api/osm/conflicts      → llistat de conflictes amb detalls
 * GET  /api/osm/conflicts/osc  → descarregar .osc únic amb tots els conflictes
 * POST /api/osm/conflicts/resolve → resoldre un conflicte després de JOSM
 * GET  /api/osm/reviews        → hidrants amb dades per revisar abans de pujar
 */
const handler: ApiHandler = async (req, res) => {
  const { method, url, body } = req;
  const path = url?.split("?")[0] || "";

  // module/operation via child (hook ja posa http/path, override a osm per domini)
  req.log.child({ module: "osm", operation: `${method} ${path}` }).info(
    {
      query: req.query,
      body: body ? { ...body, ids: body.ids ? body.ids.slice(0, 2) : undefined } : undefined,
    },
    `${method} ${path}`,
  );

  // GET /api/osm/status
  if (method === "GET" && path === "/api/osm/status") {
    const configured = isConfigured();
    const conflicts = HidrantsRepository.findConflicts();
    const stats = HidrantsRepository.getSyncStats(0); // global
    return res.json({ configured, conflictCount: conflicts.length, stats });
  }

  // POST /api/osm/push-sync
  if (method === "POST" && path === "/api/osm/push-sync") {
    const adfId = body?.adf_id ? Number(body.adf_id) : undefined;
    req.log
      .child({ module: "osm", operation: "pushSync" })
      .info({ adfId }, "Iniciant push sync global");
    const result = await pushSyncToOSM(adfId ? { adfId } : undefined);
    req.log.child({ module: "osm", operation: "pushSync" }).info({ result }, "Push sync completat");
    return res.json(result);
  }

  // GET /api/osm/pending?adf=ID
  if (method === "GET" && path === "/api/osm/pending") {
    const adfId = Number(req.query?.adf);
    if (!adfId || isNaN(adfId)) {
      throw new BadRequestError("Cal especificar l'ADF amb ?adf=ID");
    }
    const pending = HidrantsRepository.findByAdfWithDetails(adfId);
    const stats = HidrantsRepository.getSyncStats(adfId);
    return res.json({ pending, stats });
  }

  // POST /api/osm/push-selected
  if (method === "POST" && path === "/api/osm/push-selected") {
    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError("Cal especificar els IDs a pujar");
    }
    req.log
      .child({ module: "osm", operation: "pushSelected" })
      .info({ count: ids.length, firstIds: ids.slice(0, 3) }, "Iniciant push sync seleccionat");
    const result = await pushSyncToOSM({ ids });
    req.log
      .child({ module: "osm", operation: "pushSelected" })
      .info({ result }, "Push sync seleccionat completat");
    return res.json(result);
  }

  // POST /api/osm/discard-selected
  if (method === "POST" && path === "/api/osm/discard-selected") {
    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError("Cal especificar els IDs a descartar");
    }
    req.log
      .child({ module: "osm", operation: "discardSelected" })
      .info({ count: ids.length, firstIds: ids.slice(0, 3) }, "Descartant canvis seleccionats");

    // Els PENDING_CREATE mai han existit a OSM → esborrar-los de la BD
    // La resta → marcar SYNCED (els canvis locals es descarten, OSM és la referència)
    const hydrants = HidrantsRepository.findByIds(ids);
    const toDelete = hydrants.filter((h) => h.sync_status === "PENDING_CREATE").map((h) => h.id);
    const toSync = hydrants.filter((h) => h.sync_status !== "PENDING_CREATE").map((h) => h.id);

    req.log
      .child({ module: "osm", operation: "discardSelected" })
      .info({ toDelete: toDelete.length, toSync: toSync.length }, "Estadístiques descartament");

    if (toDelete.length > 0) {
      HidrantsRepository.deleteMany(toDelete);
      req.log
        .child({ module: "osm", operation: "discardSelected" })
        .info({ count: toDelete.length }, "Hidrants esborrats de BD (mai publicats)");
    }
    if (toSync.length > 0) {
      // Restaurar les etiquetes d'OSM des de remote_osm_tags abans de marcar com a sincronitzat
      const now = new Date().toISOString();
      let restoredCount = 0;
      for (const hydrantId of toSync) {
        const hydrant = hydrants.find((h) => h.id === hydrantId);
        if (hydrant && hydrant.remote_osm_tags && hydrant.adf_id !== null) {
          db.update(hidrants)
            .set({
              osm_tags: hydrant.remote_osm_tags,
              sync_status: "SYNCED",
              synced_at: now,
              updated_at: now,
            })
            .where(eq(hidrants.id, hydrantId))
            .run();
          restoredCount++;
        }
      }
      req.log
        .child({ module: "osm", operation: "discardSelected" })
        .info(
          { restored: restoredCount, reverted: toSync.length - restoredCount },
          "Canvis locals descartats",
        );
    }

    return res.json({ discarded: toSync.length, deleted: toDelete.length });
  }

  // GET /api/osm/conflicts
  if (method === "GET" && path === "/api/osm/conflicts") {
    const conflicts = getConflicts();
    req.log
      .child({ module: "osm", operation: "listConflicts" })
      .info({ count: conflicts.length }, "Llistant conflictes");
    return res.json(conflicts);
  }

  // GET /api/osm/conflicts/osc
  if (method === "GET" && path === "/api/osm/conflicts/osc") {
    const osc = generateOscFile();
    if (!osc) {
      return res.json({ message: "No hi ha conflictes per exportar" });
    }
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", 'attachment; filename="conflictes_osc.osc"');
    return res.send(osc);
  }

  // POST /api/osm/conflicts/resolve
  if (method === "POST" && path === "/api/osm/conflicts/resolve") {
    const id = body?.id;
    if (!id) {
      throw new BadRequestError("Cal especificar l'id del conflicte");
    }
    const resolved = await resolveAfterJOSM(id);
    return res.json({ resolved });
  }

  // GET /api/osm/reviews
  if (method === "GET" && path === "/api/osm/reviews") {
    const reviews = HidrantsRepository.findByReview();
    const formatted = reviews.map((h) => ({
      id: h.id,
      osm_id: h.osm_id,
      lat: h.lat,
      lon: h.lon,
      sync_error: h.sync_error ? JSON.parse(h.sync_error) : [],
    }));
    return res.json({ reviews: formatted, count: formatted.length });
  }

  // POST /api/osm/pull-hydrant — aplicar versió d'OSM a un hidrant individual
  if (method === "POST" && path === "/api/osm/pull-hydrant") {
    const id = body?.id;
    if (!id) {
      throw new BadRequestError("Cal especificar l'id del hidrant");
    }
    req.log
      .child({ module: "osm", operation: "pullHydrant" })
      .info({ id }, "Baixant hidrant individual d'OSM");

    const hydrant = HidrantsRepository.findByIds([id])[0];
    if (!hydrant) {
      req.log.child({ module: "osm", operation: "pullHydrant" }).error({ id }, "Hidrant no trobat");
      throw new BadRequestError("Hidrant no trobat");
    }
    if (!hydrant.osm_id) {
      req.log
        .child({ module: "osm", operation: "pullHydrant" })
        .error({ id }, "Hidrant sense osm_id");
      throw new BadRequestError("L'hidrant no té osm_id associat");
    }

    // Descarregar node des d'OSM
    const { queryOverpass } = await import("../services/overpass.js");
    const result = await queryOverpass(`[out:json];node(${hydrant.osm_id});out body;`);
    if (!result.ok || !result.data.elements || result.data.elements.length === 0) {
      req.log
        .child({ module: "osm", operation: "pullHydrant" })
        .error({ osm_id: hydrant.osm_id }, "Error baixant node d'OSM");
      throw new BadRequestError(`No s'ha pogut obtenir el node ${hydrant.osm_id} d'OSM`);
    }

    const osmNode = result.data.elements[0];
    req.log
      .child({ module: "osm", operation: "pullHydrant" })
      .info(
        { osmVersion: osmNode.version, localVersion: hydrant.osm_version },
        "Hidrant descarregat d'OSM",
      );

    HidrantsRepository.resolveConflict(hydrant.id, {
      osmVersion: osmNode.version,
      lat: osmNode.lat,
      lon: osmNode.lon,
      osmTags: JSON.stringify(osmNode.tags || {}),
    });

    req.log
      .child({ module: "osm", operation: "pullHydrant" })
      .info({ id, osmVersion: osmNode.version }, "Conflicte resolt (baixat OSM)");
    return res.json({ success: true });
  }

  // GET /api/osm/diff/:id — obtenir diff local vs OSM per un hidrant
  if (method === "GET" && path.startsWith("/api/osm/diff/")) {
    const id = path.split("/").pop();
    if (!id) {
      throw new BadRequestError("Cal especificar l'id del hidrant");
    }
    const hydrant = HidrantsRepository.findByIds([id])[0];
    if (!hydrant) {
      throw new BadRequestError("Hidrant no trobat");
    }
    if (!hydrant.osm_id) {
      return res.json({ diff: null });
    }

    // Si CONFLICT amb sync_error pre-computat, reutilitzar
    if (hydrant.sync_status === "CONFLICT" && hydrant.sync_error) {
      try {
        const errData = JSON.parse(hydrant.sync_error);
        if (errData.osmTags && errData.localTags) {
          return res.json({
            diff: {
              osmTags: errData.localTags,
              remoteOsmTags: errData.osmTags,
              localLat: errData.localLat ?? hydrant.lat,
              localLon: errData.localLon ?? hydrant.lon,
              remoteLat: errData.osmLat,
              remoteLon: errData.osmLon,
            },
          });
        }
      } catch {
        /* ignore parse error */
      }
    }

    // Si tenim dades remotes guardades (PENDING_UPDATE, ERROR, REVIEW, etc.)
    if (hydrant.remote_osm_tags) {
      const osmTags = hydrant.osm_tags ? JSON.parse(hydrant.osm_tags) : {};
      const remoteOsmTags = JSON.parse(hydrant.remote_osm_tags);
      return res.json({
        diff: {
          osmTags,
          remoteOsmTags,
          localLat: hydrant.lat,
          localLon: hydrant.lon,
          remoteLat: hydrant.remote_lat ?? hydrant.lat,
          remoteLon: hydrant.remote_lon ?? hydrant.lon,
        },
      });
    }

    return res.json({ diff: null });
  }

  res.status(405).json({ error: "Method not allowed" });
};

export default handler;
