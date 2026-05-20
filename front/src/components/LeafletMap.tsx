import { useState, useEffect, useCallback } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
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
import { SyncButton } from './SyncButton';
import { useMunicipi } from '../contexts/MunicipiContext';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

// ✅ Component per escoltar canvis al mapa i informar al pare
function MapStateListener({
  onStateChange,
}: {
  onStateChange: (bounds: [number, number, number, number], zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onStateChange(
        [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()],
        map.getZoom()
      );
    },
  });

  // Inicialitzem l'estat en muntar-se
  useEffect(() => {
    const b = map.getBounds();
    onStateChange(
      [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()],
      map.getZoom()
    );
  }, [map, onStateChange]);

  return null;
}

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
  const { municipi, isLoading } = useMunicipi();
  const { user, logout } = useAuth();
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(14);

  const handleMapStateChange = useCallback((bounds: [number, number, number, number], zoom: number) => {
    setMapBounds(prev => {
      if (!prev) return bounds;
      const threshold = 0.00001;
      const hasMovedSignificantly = 
        Math.abs(prev[0] - bounds[0]) > threshold ||
        Math.abs(prev[1] - bounds[1]) > threshold ||
        Math.abs(prev[2] - bounds[2]) > threshold ||
        Math.abs(prev[3] - bounds[3]) > threshold;

      return hasMovedSignificantly ? bounds : prev;
    });

    setMapZoom(prev => prev === zoom ? prev : zoom);
  }, []);

  const { features, loading: loadingHidrants, error: hidrantsError } = useHydrantData(mapBounds, mapZoom);
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [poi, setPoi] = useState<LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const openFormAtPosition = (latlng: L.LatLng) => {
    if (!user) return;
    setClickedPosition(latlng);
    setShowNewForm(true);
  };

  if (isLoading) {
    return <div className="loading">Carregant dades del municipi...</div>;
  }

  return (
    <>
      <MapContainer
        center={municipi?.center || [41.56, 1.72]}
        zoom={municipi ? 14 : 11}
        className="leaflet-map"
      >
        <FixMapSize />
        <MapStateListener
          onStateChange={handleMapStateChange}
        />
        <MaskedAreaMap />
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
        {user && (
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
        )}
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
          onEdit={user ? openFormAtPosition : undefined}
          setPosition={setPosition}
        />
      </MapContainer>

      <FullscreenButton targetId="map-container" />

      {user && municipi && (
        <SyncButton
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            ...floatingButtonStyle,
            background: 'white',
            color: 'black',
            width: '40px',
            height: '40px',
            fontSize: '1.2rem',
          }}
        />
      )}

      {/* Botó Login/Logout */}
      <button
        onClick={user ? logout : () => setShowLoginModal(true)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: user ? '4.5rem' : '1rem',
          ...floatingButtonStyle,
          background: user ? '#e74c3c' : 'white',
          color: user ? 'white' : 'black',
          width: 'auto',
          padding: '0 10px',
          height: '40px',
          fontSize: '0.8rem',
          zIndex: 1000,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {user ? `Surt (${user.username})` : '🔐'}
      </button>

      {showLoginModal && !user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }} onClick={() => setShowLoginModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Login />
          </div>
        </div>
      )}

      {loadingHidrants && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          zIndex: 1000,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontSize: '0.8rem',
          pointerEvents: 'none'
        }}>
          Actualitzant hidrants...
        </div>
      )}

      {hidrantsError && (
        <div style={{
          position: 'fixed',
          top: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '0.8rem'
        }}>
          Error: {hidrantsError}
        </div>
      )}

      {clickedPosition && showNewForm && user && (
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
      {user && (
        <NewNodeButton
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            ...floatingButtonStyle,
          }}
          onClick={() => setShowCoordModal(true)}
        />
      )}
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
