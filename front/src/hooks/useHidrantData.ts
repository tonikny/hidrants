import { useEffect, useState } from 'react';
import osm2geojson from 'osm2geojson-lite';
import { Feature, Point } from 'geojson';
import { useMunicipi } from '../contexts/MunicipiContext';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const API_HIDRANTS_URL = API_URL + '/hidrants';

export interface OSMFeature extends Feature {
  id: string;
  properties: Record<string, any> & {
    private_tags?: Record<string, string>;
    sync_status?: string;
  };
  geometry: Point;
}

export function useHydrantData(bounds?: [number, number, number, number] | null, zoom?: number) {
  const { municipi } = useMunicipi();
  const [features, setFeatures] = useState<OSMFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hi ha municipi i el zoom és baix, no carreguem res
    if (!municipi && (zoom === undefined || zoom < 14)) {
      setFeatures([]);
      return;
    }

    const fetchHydrants = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = API_HIDRANTS_URL;
        
        // Si tenim municipi, l'API del backend ja l'identifica pel subdomini,
        // però si volguéssim passar bounds ho faríem per query string.
        if (!municipi && bounds) {
          // Per ara mantenim la consulta a /overpass per a vistes generals sense municipi
          // o podríem implementar /api/hidrants?bbox=...
          const [s, w, n, e] = bounds;
          const query = `
            [out:json][timeout:30];
            (
              node(${s},${w},${n},${e})["emergency"="fire_hydrant"];
              node(${s},${w},${n},${e})["disused:emergency"="fire_hydrant"];
            );
            out center tags;
          `.trim();
          
          const response = await fetch(API_URL + '/overpass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          
          if (!response.ok) throw new Error(`Overpass error ${response.status}`);
          const json = await response.json();
          const geojson = osm2geojson(json);
          setFeatures(geojson.features as OSMFeature[]);
          return;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `API error ${response.status}`);
        }

        const geojson = await response.json();
        setFeatures(geojson.features as OSMFeature[]);
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    // Debounce
    const timeout = setTimeout(fetchHydrants, 500);
    return () => clearTimeout(timeout);
  }, [municipi, bounds, zoom]);

  return { features, loading, error };
}
