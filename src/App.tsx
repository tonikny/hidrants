import { useEffect, useState } from 'react';
import { MapContainer, Marker } from 'react-leaflet';
import L, { latLng, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import osm2geojson from 'osm2geojson-lite';
import getHydrantIcon from './icons';
import { NodeWithForm, OSMFeature } from './NodeForm';
import { MapClickHandler, NewNodeForm } from './NewNodeForm';
import { ToastContainer } from 'react-toastify';
import { LegendModal } from './LegendModal';
import { NewNodeButton } from './NewNodeButton';
import { LocateButton } from './LocateButton';
import { Layers } from './Layers';
import { FullscreenButton } from './FullscreenButton';
import { ZoomDisplay } from './ZoomDisplay';

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

const coords: LatLng = latLng(41.5474, 1.7954);

export default function App() {
  const [features, setFeatures] = useState<OSMFeature[]>([]);
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const openFormAtPosition = (latlng: L.LatLng) => {
    setClickedPosition(latlng);
    setShowNewForm(true);
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
      });
  }, []);

  const floatingButtonStyle: React.CSSProperties = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '3rem',
    height: '3rem',
    fontSize: '1.5rem',
    cursor: 'pointer',
    zIndex: 1000,
  };

  return (
    <div id="map-container">
      <MapContainer center={coords} zoom={14} style={{ height: '100vh' }}>
        <Layers />
        <ZoomDisplay />
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
          onClick={(latlng) => {
            setClickedPosition(latlng);
            setShowNewForm(true);
          }}
          onCancel={() => {
            setClickedPosition(null);
            setShowNewForm(false);
          }}
          isActive={!!clickedPosition}
        />
        {clickedPosition && showNewForm && (
          <Marker
            position={clickedPosition}
            icon={L.icon({
              iconUrl: '/images/icons/marker-icon-gold.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [0, -41],
            })}
          />
        )}
        <LocateButton
          style={{
            position: 'fixed',
            bottom: '9rem',
            left: '1rem',
            ...floatingButtonStyle,
          }}
          onEdit={openFormAtPosition}
        />
      </MapContainer>
      <FullscreenButton targetId="map-container" />
      {clickedPosition && showNewForm && (
        <NewNodeForm
          lat={clickedPosition.lat}
          lon={clickedPosition.lng}
          onClose={() => {
            setClickedPosition(null);
          }}
          setNewNodeLatLng={setClickedPosition}
        />
      )}

      <LegendModal
        style={{
          position: 'fixed',
          bottom: '5rem',
          left: '1rem',
          ...floatingButtonStyle,
        }}
      />
      <NewNodeButton
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          ...floatingButtonStyle,
        }}
      />
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
    </div>
  );
}
