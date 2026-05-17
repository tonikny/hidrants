import { useEffect, useState } from 'react';
import osm2geojson from 'osm2geojson-lite';
import { Feature, Point } from 'geojson';
import { useMunicipi } from '../contexts/MunicipiContext';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const API_OVERPASS_URL = API_URL + '/overpass';

export interface OSMFeature extends Feature {
  id: string;
  properties: Record<string, string>;
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

    // Si no hi ha municipi i no tenim bounds, no podem fer la consulta per BBOX
    if (!municipi && !bounds) return;

    const fetchHydrants = async () => {
      setLoading(true);
      setError(null);

      let query = '';

      if (municipi) {
        // Consulta per Àrea (Municipi)
        const relationId = municipi.osmRelation.replace('R', '');
        const areaId = 3600000000 + Number(relationId);
        query = `
          [out:json][timeout:60];
          area(${areaId})->.searchArea;
          (
            node(area.searchArea)["emergency"="fire_hydrant"];
            node(area.searchArea)["disused:emergency"="fire_hydrant"];
          );
          out center tags;
        `.trim();
      } else if (bounds) {
        // Consulta per BBOX (Vista general)
        const [s, w, n, e] = bounds;
        query = `
          [out:json][timeout:30];
          (
            node(${s},${w},${n},${e})["emergency"="fire_hydrant"];
            node(${s},${w},${n},${e})["disused:emergency"="fire_hydrant"];
          );
          out center tags;
        `.trim();
      }

      if (!query) return;

      try {
        const response = await fetch(API_OVERPASS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `API error ${response.status}`);
        }

        const json = await response.json();
        const geojson = osm2geojson(json);
        setFeatures(geojson.features as OSMFeature[]);
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    // Debounce per evitar saturar l'API si l'usuari mou el mapa ràpidament
    const timeout = setTimeout(fetchHydrants, 500);
    return () => clearTimeout(timeout);
  }, [municipi, bounds, zoom]);

  return features;
}
