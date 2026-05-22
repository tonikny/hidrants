import { useState, useEffect, useCallback } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { MapClickHandler, NewNodeForm } from './NewNodeForm';
import MapRightClickHandler from './MapRightClickHandler';
import { LocateButton } from './LocateButton';
import { Layers } from './Layers';
import { ZoomDisplay } from './ZoomDisplay';
import { useHydrantData } from '../hooks/useHidrantData';
import { floatingButtonStyle } from '../styles/uiStyles';
import MaskedAreaMap from './MaskedAreaMap';
import { RouteLayer } from './RouteLayer';
import { useAdf } from '../contexts/AdfContext';
import { useAuth } from '../contexts/AuthContext';
import { HydrantMarkerList } from './HydrantMarkerList';
import { MapUIOverlays } from './MapUIOverlays';

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
  const { activeAdf, isLoading, setActiveAdf } = useAdf();
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
    return <div className="loading">Carregant dades de l'ADF...</div>;
  }

  return (
    <>
      <MapContainer
          center={activeAdf?.center || [41.56, 1.72]}
          zoom={activeAdf ? 14 : 11}
          className="leaflet-map"
      >
        <FixMapSize />
        <MapStateListener
          onStateChange={handleMapStateChange}
        />
        <MaskedAreaMap />
        <Layers />
        <ZoomDisplay />
        <MapRightClickHandler setClickedPosition={setClickedPosition} setShowNewForm={setShowNewForm} user={user} />
        <HydrantMarkerList 
          features={features} 
          setPoi={setPoi} 
          showRoute={showRoute} 
          setShowRoute={setShowRoute} 
        />
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

      {clickedPosition && showNewForm && user && (
        <NewNodeForm
          lat={clickedPosition.lat}
          lon={clickedPosition.lng}
          onClose={() => setClickedPosition(null)}
          setNewNodeLatLng={setClickedPosition}
        />
      )}

      <MapUIOverlays 
        user={user}
        logout={logout}
        activeAdf={activeAdf}
        setActiveAdf={setActiveAdf}
        loadingHidrants={loadingHidrants}
        hidrantsError={hidrantsError}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        showCoordModal={showCoordModal}
        setShowCoordModal={setShowCoordModal}
        onCoordinateConfirm={(lat, lon) => {
          const latlng = L.latLng(lat, lon);
          setClickedPosition(latlng);
          setShowNewForm(true);
          setShowCoordModal(false);
        }}
      />
    </>
  );
}
