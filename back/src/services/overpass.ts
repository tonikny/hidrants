import { config } from "../utils/config.js";

const OVERPASS_API_URL = config.OVERPASS_URL;

export interface OsmElement {
  type?: string;
  id: number;
  lat: number;
  lon: number;
  version: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export type OverpassResult =
  | { ok: true; status: number; data: { elements?: OsmElement[] } }
  | { ok: false; status: number; error: string };

/**
 * Execute a query against the Overpass API
 */
export async function queryOverpass(query: string): Promise<OverpassResult> {
  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "User-Agent": "HidrantsADF/1.0 (dalecanya@gmail.com)",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: query,
  });

  if (!response.ok) {
    const text = await response.text();
    // Retornem l'status per a que el cridant pugui decidir si és un error fatal o temporal
    return {
      ok: false,
      status: response.status,
      error: text,
    };
  }

  const data = (await response.json()) as { elements?: OsmElement[] };
  return {
    ok: true,
    status: 200,
    data,
  };
}
