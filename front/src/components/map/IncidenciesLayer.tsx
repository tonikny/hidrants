import { useEffect, useState } from 'react';
import { LayersControl, GeoJSON } from 'react-leaflet';
import L, { type LatLng } from 'leaflet';
import type { Feature } from 'geojson';

const { Overlay } = LayersControl;

export default function IncedenciesLayer({
  active = false,
}: {
  active?: boolean;
}) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    void fetch('/geojson/incidencies.geojson')
      .then((r) => r.json())
      .then(setGeojson);
  }, []);

  const icon = new L.Icon({
    iconUrl: '/images/icons/marker-icon-gold.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <>
      {geojson ? (
        <Overlay checked={active} name="Incidències">
          <GeoJSON
            data={geojson}
            pointToLayer={(feature: Feature, latlng: LatLng) =>
              L.marker(latlng, { icon })
            }
          />
        </Overlay>
      ) : null}
    </>
  );
}
