import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { useAdf } from '../../contexts/AdfContext';

export default function MaskedAreaMap() {
  const { activeAdf } = useAdf();
  const map = useMap();
  const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(
    null
  );
  const [hasFittedBounds, setHasFittedBounds] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Netegem la màscara actual mentre carreguem la nova per evitar confusions visuals
    setMask(null);

    if (!activeAdf) {
      setHasFittedBounds(null);
      return;
    }

    const fetchAndMaskArea = async () => {
      try {
        const response = await fetch(`/api/adf/boundary?adf=${activeAdf.id}`);

        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }

        const geojson = await response.json();

        if (!isMounted) return;

        // El boundary ara és un Feature directament (o pot estar dins d'un Collection)
        const areaFeature = (geojson.type === 'Feature' ? geojson : geojson.features?.[0]) as
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
          setMask(masked as any);

          // Ajustem el zoom si canviem d'ADF
          if (hasFittedBounds !== activeAdf.id) {
            // Verificació extra de seguretat per a Leaflet
            // @ts-ignore
            if (map && map._loaded && map.getContainer()) {
              if (activeAdf.bbox) {
                const bbox = activeAdf.bbox;
                map.fitBounds([
                  [bbox[0], bbox[1]],
                  [bbox[2], bbox[3]],
                ]);
              } else {
                const bbox = turf.bbox(areaFeature);
                map.fitBounds([
                  [bbox[1], bbox[0]],
                  [bbox[3], bbox[2]],
                ]);
              }
            }
            setHasFittedBounds(activeAdf.id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading masked area:', err);
        }
      }
    };

    fetchAndMaskArea();

    return () => {
      isMounted = false;
    };
  }, [map, activeAdf]); // Traiem hasFittedBounds de les dependencies per evitar bucles infinits

  if (!activeAdf) return null;

  return (
    <>
      {mask && (
        <GeoJSON
          key={`mask-${activeAdf.id}`}
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
