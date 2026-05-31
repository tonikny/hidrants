import { useEffect, useState, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { useAdf } from '../../contexts/AdfContext';

export default function MaskedAreaMap({ hidden = false }: { hidden?: boolean }) {
  const { activeAdf } = useAdf();
  const map = useMap();
  const [mask, setMask] = useState<{ id: number; data: Feature<Polygon | MultiPolygon> } | null>(null);
  const fittedAdfId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const urlParams = new URLSearchParams(window.location.search);
    const hasNodeParam = !!urlParams.get('node');

    if (!activeAdf) {
      setMask(null);
      fittedAdfId.current = null;
      return;
    }

    // Si ja tenim la màscara d'aquesta ADF, comprovem si hem de fer el fitBounds
    if (mask && mask.id === activeAdf.id) {
      if (!hasNodeParam && fittedAdfId.current !== activeAdf.id) {
        // En teoria això ja s'hauria de haver fet al setMask, però per si de cas:
        // @ts-ignore
        if (map && map._loaded && map.getContainer().clientWidth > 0) {
           const bbox = activeAdf.bbox;
           if (bbox) {
             map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]);
             fittedAdfId.current = activeAdf.id;
           }
        }
      }
      return;
    }

    const fetchAndMaskArea = async () => {
      try {
        const response = await fetch(`/api/adf/boundary?adf=${activeAdf.id}`);
        if (!response.ok) throw new Error(`API error ${response.status}`);
        const geojson = await response.json();

        if (!isMounted) return;

        const areaFeature = (geojson.type === 'Feature' ? geojson : geojson.features?.[0]) as
          | Feature<Polygon | MultiPolygon>
          | undefined;

        if (!areaFeature) return;

        const world = turf.polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]);
        const collection = turf.featureCollection([world, areaFeature]);
        const masked = turf.difference(collection);

        if (masked && isMounted) {
          setMask({ id: activeAdf.id, data: masked as any });

          if (!hasNodeParam && fittedAdfId.current !== activeAdf.id) {
            // @ts-ignore
            const container = map.getContainer();
            // @ts-ignore
            if (map && map._loaded && container && container.clientWidth > 0) {
              const bbox = activeAdf.bbox || turf.bbox(areaFeature);
              map.fitBounds(
                activeAdf.bbox 
                  ? [[bbox[0], bbox[1]], [bbox[2], bbox[3]]]
                  : [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]
              );
              fittedAdfId.current = activeAdf.id;
            }
          } else if (hasNodeParam) {
            fittedAdfId.current = activeAdf.id;
          }
        }
      } catch (err) {
        console.error('Error loading masked area:', err);
      }
    };

    fetchAndMaskArea();
    return () => { isMounted = false; };
  }, [map, activeAdf?.id, mask]); 

  if (!activeAdf || hidden) return null;

  return (
    <>
      {mask && (
        <GeoJSON
          data={mask.data}
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
