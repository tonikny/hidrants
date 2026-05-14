import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import slug from 'slug';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

const MUNICIPI = import.meta.env.VITE_MUNICIPI ?? '';

export default function MaskedAreaMap() {
  const map = useMap();
  const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(
    null
  );

  useEffect(() => {
    const fetchAndMaskArea = async () => {
      try {
        const response = await fetch(
          '/municipis/' + slug(MUNICIPI) + '.geojson'
        );

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

          const bbox = turf.bbox(areaFeature);

          map.fitBounds([
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]],
          ]);
        }
      } catch (err) {
        console.error('Error loading masked area:', err);
      }
    };

    fetchAndMaskArea();
  }, [map]);

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
