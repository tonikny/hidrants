import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { useAdf } from '../../contexts/AdfContext';
import { logError } from '../../utils/log';

export default function MaskedAreaMap({ hidden = false }: { hidden?: boolean }) {
  const { activeAdf } = useAdf();
  const [mask, setMask] = useState<{ id: number; data: Feature<Polygon | MultiPolygon> } | null>(null);
  const [boundary, setBoundary] = useState<{ id: number; data: Feature<Polygon | MultiPolygon> } | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!activeAdf) {return;}

    const fetchAndMaskArea = async () => {
      try {
        const response = await fetch(`/api/adf/boundary?adf=${activeAdf.id}`);
        if (!response.ok) {throw new Error(`API error ${response.status}`);}
        const geojson = await response.json();

        if (!isMounted) {return;}

        const areaFeature = (geojson.type === 'Feature' ? geojson : geojson.features?.[0]) as
          | Feature<Polygon | MultiPolygon>
          | undefined;

        if (!areaFeature) {return;}

        const world = turf.polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]);
        const collection = turf.featureCollection([world, areaFeature]);
        const masked = turf.difference(collection);

        if (masked && isMounted) {
          setMask({ id: activeAdf.id, data: masked });
          setBoundary({ id: activeAdf.id, data: areaFeature });
        }
      } catch (err) {
        logError('Error loading masked area', err);
      }
    };

    void fetchAndMaskArea();
    return () => { isMounted = false; };
  }, [activeAdf]); 

  if (!activeAdf) {return null;}

  return (
    <>
      {mask && mask.id === activeAdf.id && !hidden && (
        <GeoJSON
          key={`mask-${mask.id}`}
          data={mask.data}
          pathOptions={{
            fillColor: 'rgba(0, 0, 0, 0.6)',
            fillOpacity: 0.6,
            color: 'none',
          }}
        />
      )}
      {boundary && boundary.id === activeAdf.id && hidden && (
        <GeoJSON
          key={`boundary-${boundary.id}`}
          data={boundary.data}
          pathOptions={{
            fillColor: 'none',
            color: '#333',
            weight: 3,
            dashArray: '5, 10',
            opacity: 0.6,
          }}
        />
      )}
    </>
  );
}
