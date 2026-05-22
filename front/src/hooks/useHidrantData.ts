import { useState, useEffect } from 'react';
import { useAdf } from '../contexts/AdfContext';

export interface HidrantFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: any;
}

export function useHydrantData(bounds: [number, number, number, number] | null, zoom: number) {
  const { activeAdf } = useAdf();
  const [features, setFeatures] = useState<HidrantFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeAdf) {
      setFeatures([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hidrants?adf=${activeAdf.id}`);
        if (!response.ok) throw new Error('Error al carregar hidrants');
        const data = await response.json();
        setFeatures(data.features || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeAdf]);

  return { features, loading, error };
}
