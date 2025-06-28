import { useState } from 'react';
import { MapContainer, Marker } from 'react-leaflet';
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
import getHydrantIcon from './icons';
import { useHydrantData } from '../hooks/useHidrantData';
import { floatingButtonStyle } from '../styles/uiStyles';
import MaskedAreaMap from './MaskedAreaMap';

// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl:
//     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl:
//     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

const INITIAL_POSITION: LatLng = latLng(
  parseFloat(import.meta.env.VITE_INITIAL_LAT ?? '0'),
  parseFloat(import.meta.env.VITE_INITIAL_LNG ?? '0')
);

const OSM_AREA_ID = import.meta.env.VITE_OSM_AREA_ID;

export function LeafletMap() {
  const features = useHydrantData();
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);

  const openFormAtPosition = (latlng: L.LatLng) => {
    setClickedPosition(latlng);
    setShowNewForm(true);
  };

  return (
    <>
      <MapContainer
        center={INITIAL_POSITION}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <Layers />
        <ZoomDisplay />
        {features.map((feature) => {
          const coords = feature.geometry.coordinates;
          return (
            <Marker
              key={feature.id}
              position={[coords[1], coords[0]]}
              icon={getHydrantIcon(feature.properties)}
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
        <MaskedAreaMap areaId={345695} />
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
