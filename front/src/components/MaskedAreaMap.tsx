import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { useMunicipi } from '../contexts/MunicipiContext';

export default function MaskedAreaMap() {
  const { municipi } = useMunicipi();
  const map = useMap();
  const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(
    null
  );

  useEffect(() => {
    if (!municipi) return;

    const fetchAndMaskArea = async () => {
      try {
        const response = await fetch('/api/municipi/boundary');

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const geojson = await response.json();

        const areaFeature = geojson.features[0] as
          | Feature<Polygon | MultiPolygon>
          | undefined;

        if (!areaFeature) return;

        const world = turf.polygon([
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
        ]);
        const collection = turf.featureCollection([world, areaFeature]);
        const masked = turf.difference(collection);

        if (masked) {
          setMask(masked);

          // Si tenim el bbox al context, l'utilitzem (ordre: [minlat, minlon, maxlat, maxlon])
          if (municipi.bbox) {
            map.fitBounds([
              [municipi.bbox[0], municipi.bbox[1]],
              [municipi.bbox[2], municipi.bbox[3]],
            ]);
          } else {
            // Si no, el calculem (turf.bbox retorna [minlon, minlat, maxlon, maxlat])
            const bbox = turf.bbox(areaFeature);
            map.fitBounds([
              [bbox[1], bbox[0]],
              [bbox[3], bbox[2]],
            ]);
          }
        }
      } catch (err) {
        console.error('Error loading masked area:', err);
      }
    };

    fetchAndMaskArea();
  }, [map, municipi]);

  if (!municipi) return null;

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
