import { useEffect, useState } from 'react';
import osm2geojson from 'osm2geojson-lite';
import { Feature, Point } from 'geojson';

const OSM_AREA_ID = 3600000000 + Number(import.meta.env.VITE_OSM_AREA_ID);
const API_URL = import.meta.env.VITE_OVERPASS_PROXY_URL ?? '/api/overpass';

export interface OSMFeature extends Feature {
  id: string;
  properties: Record<string, string>;
  geometry: Point;
}

export function useHydrantData(): OSMFeature[] {
  const [features, setFeatures] = useState<OSMFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHydrants = async () => {
      setLoading(true);
      setError(null);

      const query = `
        [out:json][timeout:60];
        area(${OSM_AREA_ID})->.searchArea;
        (
          node(area.searchArea)["emergency"="fire_hydrant"];
          node(area.searchArea)["disused:emergency"="fire_hydrant"];
        );
        out center tags;
      `;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error: ${errText}`);
        }

        const json = await response.json();

        const geojson = osm2geojson(json);

        setFeatures(geojson.features as OSMFeature[]);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHydrants();
  }, []);

  return features;
}