import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import osmtogeojson from 'osmtogeojson';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

type Props = {
  areaId: number; // Exemple: 3600305221 (OSM relation ID)
};

export default function MaskedAreaMap({ areaId }: Props) {
  const map = useMap();
  const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(
    null
  );

  useEffect(() => {
    const fetchAndMaskArea = async () => {
      const overpassQuery = `
        [out:json][timeout:25];
        relation(${areaId});
        (._; >;);
        out body;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });

      const data = await response.json();

      // Convertim Overpass JSON → GeoJSON
      const geojson = osmtogeojson(data);

      // Busquem la relació convertida en Polygon o MultiPolygon
      const areaFeature = geojson.features.find(
        (f) =>
          (f.geometry.type === 'Polygon' ||
            f.geometry.type === 'MultiPolygon') &&
          f.properties?.type === 'boundary'
      ) as Feature<Polygon | MultiPolygon> | undefined;

      if (!areaFeature) {
        console.warn("No s'ha pogut reconstruir la geometria de la relació");
        return;
      }

      // Polygon del món sencer (per fer màscara)
      const world = turf.polygon([
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90],
        ],
      ]);

      // Calculem la màscara restant
      const collection = turf.featureCollection([world, areaFeature]);
      const masked = turf.difference(collection);

      if (masked) {
        setMask(masked as Feature<Polygon | MultiPolygon>);
        const bbox = turf.bbox(areaFeature);
        const bounds: [[number, number], [number, number]] = [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ];
        map.fitBounds(bounds);
      }
    };

    fetchAndMaskArea();
  }, [areaId, map]);

  return (
    <>
      {mask && (
        <GeoJSON
          data={mask}
          pathOptions={{
            fillColor: 'rgba(0, 0, 0, 0.6)',
            fillOpacity: 0.6,
            color: 'none',
          }}
        />
      )}
    </>
  );
}
