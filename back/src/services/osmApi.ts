import { config } from "../utils/config.js";
import { logger } from "../utils/logger.js";

const log = logger.child({ module: "osm", operation: "api" });
import {
  buildChangesetXml,
  buildNodeCreateXml,
  buildNodeUpdateXml,
  buildNodeDeleteXml,
} from "./osmXml.js";

const API_URL = config.OSM_API_URL;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.OSM_ACCESS_TOKEN}`,
    "Content-Type": "application/xml",
    Accept: "text/xml",
  };
}

// --- Tipus de retorn ---

export type OsmApiSuccess = { ok: true; status: number; data: string };
export type OsmApiConflict = {
  ok: false;
  status: 409;
  osmVersion: number;
  osmLat: number;
  osmLon: number;
  osmTags: Record<string, string>;
};
export type OsmApiError = { ok: false; status: number; error: string };
export type OsmApiResult = OsmApiSuccess | OsmApiConflict | OsmApiError;

// --- Funcions principals ---

/**
 * Crear un changeset obert. Retorna l'ID del changeset.
 */
export async function createChangeset(comment: string): Promise<number> {
  const xml = buildChangesetXml(comment);
  const res = await fetch(`${API_URL}/changeset/create`, {
    method: "PUT",
    headers: authHeaders(),
    body: xml,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error creant changeset: ${res.status} — ${text}`);
  }

  const text = await res.text();
  return Number(text.trim());
}

/**
 * Tanca un changeset.
 */
export async function closeChangeset(changesetId: number): Promise<void> {
  const res = await fetch(`${API_URL}/changeset/${changesetId}/close`, {
    method: "PUT",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    log.error({ changesetId, status: res.status, text }, "Error tancant changeset OSM");
  }
}

/**
 * Crear un node nou a OSM. Retorna l'ID assignat per OSM i la versió.
 */
export async function createNode(
  lat: number,
  lon: number,
  tags: Record<string, string>,
  changesetId: number,
): Promise<{ osmId: number; newVersion: number }> {
  const xml = buildNodeCreateXml(lat, lon, tags, changesetId);
  const res = await fetch(`${API_URL}/nodes`, {
    method: "POST",
    headers: authHeaders(),
    body: xml,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error creant node: ${res.status} — ${text}`);
  }

  const osmId = Number(await res.text());
  return { osmId, newVersion: 1 };
}

/**
 * Actualitzar un node existent a OSM.
 * Si OSM retorna 409, vol dir que la versió ha canviat → conflicte.
 */
export async function updateNode(
  osmId: number,
  version: number,
  lat: number,
  lon: number,
  tags: Record<string, string>,
  changesetId: number,
): Promise<OsmApiResult> {
  const xml = buildNodeUpdateXml(osmId, version, lat, lon, tags, changesetId);
  const res = await fetch(`${API_URL}/node/${osmId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: xml,
  });

  if (res.status === 409) {
    // Conflicte de versió — obtenir l'estat actual d'OSM
    const current = await getNode(osmId);
    if (current) {
      return {
        ok: false,
        status: 409,
        osmVersion: current.version,
        osmLat: current.lat,
        osmLon: current.lon,
        osmTags: current.tags,
      };
    }
    return { ok: false, status: 409, error: "409 Sense dades d'OSM" };
  }

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text };
  }

  // 200 OK — la nova versió ve al cos de la resposta
  const newVersion = Number(await res.text());
  return { ok: true, status: 200, data: String(newVersion) };
}

/**
 * Esborrar un node a OSM.
 */
export async function deleteNode(
  osmId: number,
  version: number,
  changesetId: number,
): Promise<OsmApiResult> {
  const xml = buildNodeDeleteXml(osmId, version, changesetId);
  const res = await fetch(`${API_URL}/node/${osmId}`, {
    method: "DELETE",
    headers: authHeaders(),
    body: xml,
  });

  if (res.status === 409) {
    const current = await getNode(osmId);
    if (current) {
      return {
        ok: false,
        status: 409,
        osmVersion: current.version,
        osmLat: current.lat,
        osmLon: current.lon,
        osmTags: current.tags,
      };
    }
    return { ok: false, status: 409, error: "409 Sense dades d'OSM" };
  }

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text };
  }

  return { ok: true, status: 200, data: "" };
}

/**
 * Obtenir l'estat actual d'un node des d'OSM.
 * Retorna null si no existeix o hi ha error.
 */
export async function getNode(osmId: number): Promise<{
  version: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
} | null> {
  try {
    const res = await fetch(`${API_URL}/node/${osmId}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        id: number;
        version: number;
        lat: number;
        lon: number;
        tags?: Record<string, string>;
      }>;
    };

    const node = data.elements?.[0];
    if (!node) {
      return null;
    }

    return {
      version: node.version,
      lat: node.lat,
      lon: node.lon,
      tags: node.tags || {},
    };
  } catch {
    return null;
  }
}

/**
 * Comprovar si el token OSM està configurat.
 */
export function isConfigured(): boolean {
  return !!config.OSM_ACCESS_TOKEN;
}
