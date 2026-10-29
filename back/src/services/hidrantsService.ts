import { v4 as uuidv4 } from "uuid";
import { HidrantsRepository } from "../db/repositories/hidrantsRepository.js";
import { syncAdfFromOSM } from "./osmSync.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../errors.js";
import { osm2Ui, ui2Osm, type HydrantUiFields } from "../utils/osmConversion.js";
import { db } from "../db/index.js";
import { adfs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  isPointInBoundary,
  clampToMaxDistance,
  hasPositionChanged,
  MAX_HYDRANT_MOVE_METERS,
} from "../utils/geo.js";
import { logger } from "../utils/logger.js";

const log = logger.child({ module: "hidrants", operation: "service" });

/**
 * Parseja un camp de text que hauria de contenir un objecte JSON.
 * Retorna {} si és buit o malmès perquè una fila defectuosa no faci
 * fallar la llista sencera de l'ADF.
 */
function parseJsonObject<T extends Record<string, unknown>>(value: string | null | undefined): T {
  if (!value) {
    return {} as T;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    /* valor no JSON: ignorem el contingut */
  }
  return {} as T;
}

/**
 * `sync_error` pot contenir JSON (conflictes/revisions) o text pla (estat ERROR).
 * Si no és JSON vàlid el retornem tal qual perquè el frontend el pugui mostrar.
 */
function parseSyncError(value: string | null | undefined): unknown {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export const HidrantsService = {
  async forceSync(adfId: number, force = false) {
    const result = await syncAdfFromOSM(adfId, force);
    return result;
  },

  async getGeoJson(adfId: number) {
    const count = HidrantsRepository.countByAdf(adfId);

    if (count === 0) {
      log.info({ adfId }, "Inicialitzant dades per ADF");
      try {
        await syncAdfFromOSM(adfId);
      } catch (syncErr) {
        log.error({ err: syncErr, adfId }, "Error a la sincronització inicial d'OSM");
      }
    }

    const rows = HidrantsRepository.findActiveByAdf(adfId);

    const features = rows.map((row) => {
      const osm_tags = parseJsonObject<Record<string, string>>(row.osm_tags);
      const ui_fields = osm2Ui(osm_tags);

      return {
        type: "Feature",
        id: row.id,
        geometry: {
          type: "Point",
          coordinates: [row.lon, row.lat],
        },
        properties: {
          id: row.id,
          osm_id: row.osm_id,
          osm_tags, // Ara van en el seu propi objecte, no escampats
          ui_fields,
          private_tags: parseJsonObject(row.private_tags),
          sync_status: row.sync_status,
          sync_error: parseSyncError(row.sync_error),
          synced_at: row.synced_at,
          remote_osm_tags: row.remote_osm_tags ? parseJsonObject(row.remote_osm_tags) : null,
          remote_lat: row.remote_lat,
          remote_lon: row.remote_lon,
          updated_at: row.updated_at,
        },
      };
    });

    return {
      type: "FeatureCollection",
      features,
    };
  },

  createLocal(
    adfId: number,
    lat: number,
    lon: number,
    ui_fields?: HydrantUiFields,
    private_tags?: Record<string, unknown>,
  ) {
    if (!lat || !lon) {
      throw new BadRequestError("Missing lat or lon");
    }

    const adf = db
      .select({ boundary_geojson: adfs.boundary_geojson })
      .from(adfs)
      .where(eq(adfs.id, adfId))
      .get();
    if (!isPointInBoundary(lat, lon, adf?.boundary_geojson ?? null)) {
      throw new ForbiddenError("Coordenades fora del límit de l'ADF");
    }

    const osm_tags = ui_fields ? ui2Osm(ui_fields) : {};
    const id = uuidv4();

    HidrantsRepository.create({
      id,
      adf_id: adfId,
      lat,
      lon,
      osm_tags: JSON.stringify(osm_tags),
      private_tags: JSON.stringify(private_tags || {}),
      sync_status: "PENDING_CREATE",
    });

    return { id, sync_status: "PENDING_CREATE" };
  },

  updateLocal(
    id: string,
    adfId: number,
    lat?: number,
    lon?: number,
    ui_fields?: HydrantUiFields,
    private_tags?: Record<string, unknown>,
  ) {
    if (!id) {
      throw new BadRequestError("Missing hydrant ID");
    }

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) {
      throw new NotFoundError("Hydrant not found");
    }

    // Limitem el desplaçament respecte a la posició actual (defensa en profunditat,
    // el frontend ja fa el mateix clamp visualment durant el drag).
    if (lat !== undefined || lon !== undefined) {
      const clamped = clampToMaxDistance(
        current.lat,
        current.lon,
        lat ?? current.lat,
        lon ?? current.lon,
        MAX_HYDRANT_MOVE_METERS,
      );
      lat = clamped.lat;
      lon = clamped.lon;
    }

    // Determinem si hi ha canvis que afecten OSM (lat, lon, osm_tags)
    let hasOsmChanges = false;

    // Comprovar canvis de posició (amb tolerància: no es comparen floats amb `!==`)
    const positionChanged = hasPositionChanged(current.lat, current.lon, lat, lon);
    if (positionChanged) {
      hasOsmChanges = true;
    } else {
      // Sense canvi real: no desem el soroll numèric, la posició guardada es manté intacta.
      lat = undefined;
      lon = undefined;
    }

    if (positionChanged) {
      const finalLat = lat ?? current.lat;
      const finalLon = lon ?? current.lon;
      const adf = db
        .select({ boundary_geojson: adfs.boundary_geojson })
        .from(adfs)
        .where(eq(adfs.id, adfId))
        .get();
      if (!isPointInBoundary(finalLat, finalLon, adf?.boundary_geojson ?? null)) {
        throw new ForbiddenError("Coordenades fora del límit de l'ADF");
      }
    }

    // Comprovar canvis en osm_tags
    let osm_tags = undefined;
    if (ui_fields) {
      const currentOsmTags = JSON.parse(current.osm_tags || "{}");
      const newTags = ui2Osm(ui_fields);

      if (ui_fields.estat) {
        delete currentOsmTags["emergency"];
        delete currentOsmTags["disused:emergency"];
      }

      osm_tags = {
        ...currentOsmTags,
        ...newTags,
      };

      // Comparar si realment han canviat els tags
      if (JSON.stringify(osm_tags) !== JSON.stringify(JSON.parse(current.osm_tags || "{}"))) {
        hasOsmChanges = true;
      }
    }

    // Canvi de sync_status només si hi ha canvis en camps OSM (lat/lon/etiquetes d'OSM),
    // sense tenir en compte camps privats (observacions, etc.)
    let newSyncStatus = current.sync_status;
    if (hasOsmChanges && current.sync_status === "SYNCED") {
      newSyncStatus = "PENDING_UPDATE";
    }

    HidrantsRepository.update(id, adfId, {
      lat,
      lon,
      osm_tags: osm_tags ? JSON.stringify(osm_tags) : undefined,
      private_tags: private_tags ? JSON.stringify(private_tags) : undefined,
      sync_status: newSyncStatus,
    });

    return { success: true, sync_status: newSyncStatus };
  },

  deleteLocal(id: string, adfId: number) {
    if (!id) {
      throw new BadRequestError("Missing hydrant ID");
    }

    const current = HidrantsRepository.findByIdAndAdf(id, adfId);
    if (!current) {
      throw new NotFoundError("Hydrant not found");
    }

    if (current.sync_status === "PENDING_CREATE") {
      HidrantsRepository.delete(id);
    } else {
      HidrantsRepository.markForDeletion(id);
    }

    return { success: true };
  },

  getSyncStats(adfId: number) {
    return HidrantsRepository.getSyncStats(adfId);
  },
};
