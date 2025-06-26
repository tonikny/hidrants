import { useEffect, useState } from 'react';
import osm2geojson from 'osm2geojson-lite';
import { Feature, Point } from 'geojson';

const OSM_AREA_ID = import.meta.env.VITE_OSM_AREA_ID;
const OVERPASS_URL =
  import.meta.env.VITE_OVERPASS_URL ??
  'https://overpass-api.de/api/interpreter';

export interface OSMFeature extends Feature {
  id: string;
  properties: Record<string, string>;
  geometry: Point;
}
export function useHydrantData(): OSMFeature[] {
  const [features, setFeatures] = useState<OSMFeature[]>([]);

  useEffect(() => {
    const fetchHydrants = async () => {
      const query = `
        [out:json][timeout:60];
        area(${OSM_AREA_ID})->.searchArea;
        (
          node(area.searchArea)["emergency"="fire_hydrant"];
          node(area.searchArea)["disused:emergency"="fire_hydrant"];
        );
        out center tags;
      `;

      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: query,
      });
      const json = await response.json();
      const geojson = osm2geojson(json);
      setFeatures(geojson.features as OSMFeature[]);
    };

    fetchHydrants();
  }, []);

  return features;
}
