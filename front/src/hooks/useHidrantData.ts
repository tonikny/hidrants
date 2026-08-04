import { useState, useEffect } from 'react';
import { useAdf } from '../contexts/AdfContext';
import type { HydrantUiFields } from '../utils/osmConversion';

export interface HidrantFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    osm_id: number;
    ui_fields: HydrantUiFields;
    osm_tags: Record<string, string>;
    private_tags?: Record<string, unknown> & { observacions?: string };
    sync_status: string;
    updated_at: string;
  };
}

export function useHydrantData() {
  const { activeAdf } = useAdf();
  const [features, setFeatures] = useState<HidrantFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!activeAdf) {
      setFeatures([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/hidrants?adf=${activeAdf.id}`);
      if (!response.ok) {throw new Error('Error al carregar hidrants');}
      const data = await response.json();
      
      // Només actualitzem si encara estem a la mateixa ADF
      setFeatures(data.features || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- càrrega asíncrona legítima
    void fetchData();
  }, [activeAdf?.id]); // Use activeAdf.id as dependency

  return { features, loading, error, mutate: fetchData };
}
