import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import L, { latLng, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import osm2geojson from 'osm2geojson-lite';
import getHydrantIcon from './icons';
import { Legend } from './Legend';
import { NodeWithForm, OSMFeature } from './NodeForm';
import { MapClickHandler, NewNodeForm } from './NewNodeForm';

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

const { BaseLayer, Overlay } = LayersControl;

const coords: LatLng = latLng(41.5474, 1.7954);

export default function App() {
  const [features, setFeatures] = useState<OSMFeature[]>([]);
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);

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
      });
  }, []);

  return (
    <>
      <MapContainer center={coords} zoom={14} style={{ height: '100vh' }}>
        <Layers />
        <Legend />
        {features.map((feature) => {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          return (
            <Marker
              key={feature.id}
              position={[coords[1], coords[0]]}
              icon={getHydrantIcon(props)}
            >
              <NodeWithForm feature={feature} />
            </Marker>
          );
        })}
        <MapClickHandler
          onClick={(latlng) =>
            setClickedPosition(L.latLng(latlng.lat, latlng.lng))
          }
          onCancel={() => setClickedPosition(null)} // 👈 tanca el formulari
        />
      </MapContainer>
      {clickedPosition && (
        <NewNodeForm
          lat={clickedPosition.lat}
          lon={clickedPosition.lng}
          onClose={() => setClickedPosition(null)}
        />
      )}
      <button
        onClick={() =>
          alert(
            'Per afegir un node manualment, fes una pulsació llarga o un clic dret en el mapa'
          )
        }
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        title="Afegir node manualment"
      >
        +
      </button>
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
