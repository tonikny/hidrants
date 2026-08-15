import { useState, useEffect, useCallback } from "react";
import { useAdf } from "../contexts/AdfContext";
import type { HydrantUiFields } from "../utils/osmConversion";

export interface HidrantFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    osm_id: number;
    ui_fields: HydrantUiFields;
    osm_tags: Record<string, string>;
    private_tags?: Record<string, unknown> & { observacions?: string };
    sync_status: string;
    sync_error: {
      diffFields?: string[];
      osmTags?: Record<string, string>;
      osmLat?: number;
      osmLon?: number;
      localLat?: number;
      localLon?: number;
      message?: string;
    } | null;
    synced_at: string | null;
    remote_osm_tags: Record<string, string> | null;
    remote_lat: number | null;
    remote_lon: number | null;
    updated_at: string;
  };
}

export function useHydrantData() {
  const { activeAdf } = useAdf();
  const [features, setFeatures] = useState<HidrantFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeAdf) {
      setFeatures([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/hidrants?adf=${activeAdf.id}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Error al carregar hidrants");
      }
      const data = await response.json();

      // Només actualitzem si encara estem a la mateixa ADF
      setFeatures(data.features || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setLoading(false);
    }
  }, [activeAdf?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- càrrega asíncrona legítima
    void fetchData();
  }, [fetchData]);

  // Escolta l'event refresh-hidrants per actualitzar immediatament la vista
  useEffect(() => {
    const handler = () => {
      void fetchData();
    };
    window.addEventListener("refresh-hidrants", handler);
    return () => window.removeEventListener("refresh-hidrants", handler);
  }, [fetchData]);

  return { features, loading, error, mutate: fetchData };
}
