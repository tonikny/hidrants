import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import osm2geojson from 'osm2geojson-lite';
import { Feature, Point } from 'geojson';
import getHydrantIcon from './icons';
import { Legend } from './Legend';
import {
  MapClickHandler,
  NodeForm,
  NodePopup,
  sendToTelegram,
} from './MapWithForm';

// Fix per les icones de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OSMFeature extends Feature {
  id: string;
  properties: Record<string, string>;
  // {
  //   id: number;
  //   type: 'node' | 'way' | 'relation';
  //   // tags?: Record<string, string>;
  // };
  geometry: Point;
}

const { BaseLayer, Overlay } = LayersControl;

const coords: LatLngExpression = [41.5474, 1.7954];
const posicioHidrants = (key: string) => {
  switch (key) {
    case 'lane':
      return 'Calçada';
    case 'sidewalk':
      return 'Vorera';
    case 'green':
      return 'Verd';
    default:
      return 'Desconegut';
  }
};
const tipusHidrants = (key: string) => {
  switch (key) {
    case 'underground':
      return 'Subterrani';
    case 'pillar':
      return 'Columna';
    default:
      return 'Desconegut';
  }
};
const estatHidrants = (props: Record<string, string>) => {
  if (props['emergency'] === 'fire_hydrant') return 'Operatiu';
  if (props['disused:emergency'] === 'fire_hydrant') return 'Fora de servei';
  return 'Desconegut';
};

const diametreHidrant = 'Diametre';

export default function App() {
  const [features, setFeatures] = useState<OSMFeature[]>([]);
  const [clickedPosition, setClickedPosition] = useState<
    [number, number] | null
  >(null);
  const [message, setMessage] = useState('');

  const handleSend = async (feature: OSMFeature) => {
    await sendToTelegram({
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      tags: {
        ...feature.properties,
        comment: message,
      },
    });
    alert('Missatge enviat!');
    setMessage('');
  };

  useEffect(() => {
    const query = `
      [out:json][timeout:60];
      area(3600345695)->.searchArea;
      (
        node(area.searchArea)["emergency"="fire_hydrant"];
        node(area.searchArea)["disused:emergency"="fire_hydrant"];
      );
      out center tags;
    `;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then((res) => res.json())
      .then((data) => {
        const geojson = osm2geojson(data);
        setFeatures(geojson.features as OSMFeature[]);
        // console.log('FEATURES: ', geojson.features as OSMFeature[]);
      });
  }, []);

  return (
    <>
      <MapContainer center={coords} zoom={14} style={{ height: '100vh' }}>
        <Layers />
        <Legend />
        {features.map((feature) => {
          const id = String(feature.id).split('/')[1];
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          const translatedTags = {
            'Data de revisió': props['survey:date'],
            Estat: estatHidrants(props),
            Tipus: tipusHidrants(props['fire_hydrant:type']),
            Posició: posicioHidrants(props['fire_hydrant:position']),
            Diametre: props['fire_hydrant:diameter'] ?? 'Desconegut',
            Adreça: `${props['addr:street']} ${
              props['addr:housenumber'] ?? ''
            } (${props['addr:neighbourhood'] ?? ''})`,
          };
          return (
            <Marker
              key={feature.id}
              position={[coords[1], coords[0]]}
              icon={getHydrantIcon(props)}
            >
              <Popup>
                <strong>Id:</strong> {id}
                <br />
                {Object.entries(translatedTags).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong>
                    {typeof value === 'string' || typeof value === 'number'
                      ? value
                      : JSON.stringify(value)}
                  </div>
                ))}
                <strong>Info: </strong>
                <a href={`https://www.openstreetmap.org/node/${id}`}>
                  Veure en OSM
                </a>
                <textarea
                  placeholder="Comentari"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <button onClick={() => handleSend(feature)}>Enviar</button>
              </Popup>
            </Marker>
          );
        })}
        <MapClickHandler
          onClick={(latlng) => setClickedPosition([latlng.lat, latlng.lng])}
        />
      </MapContainer>
      {clickedPosition && (
        <NodeForm
          lat={clickedPosition[0]}
          lon={clickedPosition[1]}
          onClose={() => setClickedPosition(null)}
        />
      )}
    </>
  );
}

const Layers = () => (
  <LayersControl position="topright">
    <BaseLayer checked name="OpenStreetMap">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </BaseLayer>

    <BaseLayer name="OpenTopoMap">
      <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
    </BaseLayer>

    <BaseLayer name="Raster IGN">
      <TileLayer
        url="https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg"
        attribution="&copy; Instituto Geográfico Nacional de España"
      />
    </BaseLayer>
    <BaseLayer name="Ortoimagen IGN">
      <TileLayer
        url="https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg"
        attribution="&copy; Instituto Geográfico Nacional de España"
      />
    </BaseLayer>
  </LayersControl>
);
