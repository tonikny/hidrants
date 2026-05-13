import { useState, useEffect } from 'react';
import { MapContainer, Marker, useMap } from 'react-leaflet';
import L, { latLng, LatLng } from 'leaflet';
import { NodeWithForm } from './NodeForm';
import { MapClickHandler, NewNodeForm } from './NewNodeForm';
import { LegendModal } from './LegendModal';
import { NewNodeButton } from './NewNodeButton';
import { LocateButton } from './LocateButton';
import { Layers } from './Layers';
import { FullscreenButton } from './FullscreenButton';
import { ZoomDisplay } from './ZoomDisplay';
import { CoordinateModal } from './CoordinateModal';
import getHydrantIcon from '../utils/icons';
import { useHydrantData } from '../hooks/useHidrantData';
import { floatingButtonStyle } from '../styles/uiStyles';
import MaskedAreaMap from './MaskedAreaMap';
import { RouteLayer } from './RouteLayer';

const INITIAL_POSITION: LatLng = latLng(
  Number.parseFloat(import.meta.env.VITE_INITIAL_LAT ?? '0'),
  Number.parseFloat(import.meta.env.VITE_INITIAL_LNG ?? '0')
);

const OSM_AREA_ID = import.meta.env.VITE_OSM_AREA_ID;

// ✅ Component funcional que força el redibuix del mapa després de muntar-se
function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
}

export function LeafletMap() {
  const features = useHydrantData();
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [poi, setPoi] = useState<LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const openFormAtPosition = (latlng: L.LatLng) => {
    setClickedPosition(latlng);
    setShowNewForm(true);
  };

  return (
    <>
      <MapContainer center={INITIAL_POSITION} zoom={14} className="leaflet-map">
        <FixMapSize />
        <MaskedAreaMap areaId={OSM_AREA_ID} />
        <Layers />
        <ZoomDisplay />
        {features.map((feature) => {
          const coords = feature.geometry.coordinates;
          return (
            <Marker
              key={feature.id}
              position={[coords[1], coords[0]]}
              icon={getHydrantIcon(feature.properties)}
              eventHandlers={{
                click: () => {
                  setPoi(latLng(coords[1], coords[0]));
                },
              }}
            >
              <NodeWithForm
                feature={feature}
                showRoute={showRoute}
                setShowRoute={setShowRoute}
              />
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
        {poi && position && showRoute && (
          <RouteLayer from={position} to={poi} />
        )}
        <LocateButton
          style={{
            position: 'fixed',
            bottom: '9rem',
            left: '1rem',
            ...floatingButtonStyle,
          }}
          onEdit={openFormAtPosition}
          setPosition={setPosition}
        />
      </MapContainer>

      <FullscreenButton targetId="map-container" />

      {clickedPosition && showNewForm && (
        <NewNodeForm
          lat={clickedPosition.lat}
          lon={clickedPosition.lng}
          onClose={() => setClickedPosition(null)}
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
        onClick={() => setShowCoordModal(true)}
      />
      {showCoordModal && (
        <CoordinateModal
          onClose={() => setShowCoordModal(false)}
          onConfirm={(lat, lon) => {
            const latlng = L.latLng(lat, lon);
            setClickedPosition(latlng);
            setShowNewForm(true);
            setShowCoordModal(false);
          }}
        />
      )}
    </>
  );
}
