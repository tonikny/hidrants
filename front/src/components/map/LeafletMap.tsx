import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { MapClickHandler, NewNodeForm } from '../ui/NewNodeForm';
import { CreationSelector } from '../ui/CreationSelector';
import { NewIncidentForm } from '../ui/NewIncidentForm';
import MapRightClickHandler from './MapRightClickHandler';
import { LocateButton } from '../controls/LocateButton';
import { Layers } from './Layers';
import { ZoomDisplay } from '../controls/ZoomDisplay';
import MaskedAreaMap from './MaskedAreaMap';
import { RouteLayer } from './RouteLayer';
import { useAdf } from '../../contexts/AdfContext';
import { useAuth } from '../../contexts/AuthContext';
import { HydrantMarkerList } from './markers/HydrantMarkerList';
import { MapUrlHandler } from './MapUrlHandler';
import { MapUIOverlays } from '../controls/MapUIOverlays';
import { LocationMarker } from './LocationMarker';

import { Modal } from '../ui/Modal';
import { useHydrantData } from '../../hooks/useHidrantData';
import { useIncidencies } from '../../hooks/useIncidencies';
import { IncidentMarkerList } from './markers/IncidentMarkerList';
import { toast } from 'react-toastify';
import { isPointInBoundary } from '../../utils/geo';

// ✅ Centra el mapa en el node seleccionat, tenint en compte el bottomsheet obert
function MapNodeCenter() {
  const map = useMap();

  useEffect(() => {
    const handler = (e: any) => {
      const [lon, lat] = e.detail.geometry.coordinates;
      const sheet = document.querySelector('[class*="z-[1000]"]');
      let targetY = map.getSize().y / 2;
      if (sheet && sheet.getBoundingClientRect().height > 0) {
        targetY = sheet.getBoundingClientRect().top / 2;
      }
      const p = map.latLngToContainerPoint([lat, lon]);
      map.panBy(L.point(0, p.y - targetY), { animate: true });
    };

    window.addEventListener('map-center-node', handler);
    return () => window.removeEventListener('map-center-node', handler);
  }, [map]);

  return null;
}

// ✅ Component per escoltar canvis al mapa i informar al pare
function MapStateListener({
  onStateChange,
  onMapClick,
}: {
  onStateChange: (
    bounds: [number, number, number, number],
    zoom: number
  ) => void;
  onMapClick?: () => void;
}) {
  const map = useMapEvents({
    click: () => {
      onMapClick?.();
    },
    moveend: () => {
      const b = map.getBounds();
      onStateChange(
        [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()],
        map.getZoom()
      );
    },
  });

  // Inicialitzem l'estat en muntar-se, però amb un petit delay per evitar loops de render
  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore
      if (map && map._loaded && map.getContainer()) {
        const b = map.getBounds();
        onStateChange(
          [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()],
          map.getZoom()
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// ✅ Component funcional que força el redibuix del mapa després de muntar-se
function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore
      if (map && map._loaded && map.getContainer()) {
        map.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}
export function LeafletMap({ onSelectNode, onMapClick, selectedNodeId }: { onSelectNode?: (f: any) => void; onMapClick?: () => void; selectedNodeId?: string | null }) {
  const { activeAdf, isLoading, setActiveAdf, boundaryGeojson } = useAdf();
  const { user, logout } = useAuth();
  const [mapBounds, setMapBounds] = useState<
    [number, number, number, number] | null
  >(null);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [activeTechnicalLayer, setActiveTechnicalLayer] = useState<
    string | null
  >(null);
  const [hydrantsVisible, setHydrantsVisible] = useState(true);

  const handleMapStateChange = useCallback(
    (bounds: [number, number, number, number], zoom: number) => {
      setMapBounds((prev) => {
        if (!prev) return bounds;
        const threshold = 0.00001;
        const hasMovedSignificantly =
          Math.abs(prev[0] - bounds[0]) > threshold ||
          Math.abs(prev[1] - bounds[1]) > threshold ||
          Math.abs(prev[2] - bounds[2]) > threshold ||
          Math.abs(prev[3] - bounds[3]) > threshold;

        return hasMovedSignificantly ? bounds : prev;
      });

      setMapZoom((prev) => (prev === zoom ? prev : zoom));
    },
    []
  );

  const {
    features,
    loading: loadingHidrants,
    error: hidrantsError,
    mutate: refreshHidrants,
  } = useHydrantData(mapBounds, mapZoom);

  const {
    features: incidentFeatures,
    refresh: refreshIncidencies
  } = useIncidencies();

  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);

  const [activeForm, setActiveForm] = useState<
    'selection' | 'hydrant' | 'incident' | null
  >(null);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [poi, setPoi] = useState<LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  const openFormAtPosition = (latlng: L.LatLng) => {
    if (!user) return;
    if (!isPointInBoundary(latlng.lat, latlng.lng, boundaryGeojson)) {
      toast.warning('Coordenades fora del límit de l\'ADF');
      return;
    }
    setClickedPosition(latlng);
    setActiveForm('selection');
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
        <MapNodeCenter />
        {/* Gestiona l'obertura de nodes via URL (?node=ID) */}
        <MapUrlHandler features={features} />
        <MapStateListener onStateChange={handleMapStateChange} onMapClick={onMapClick} />
        <MaskedAreaMap hidden={!!activeTechnicalLayer} />
        <Layers
          activeTechnicalLayer={activeTechnicalLayer}
          setActiveTechnicalLayer={setActiveTechnicalLayer}
          hydrantsVisible={hydrantsVisible}
          setHydrantsVisible={setHydrantsVisible}
        />
        <MapRightClickHandler
          setClickedPosition={setClickedPosition}
          setActiveForm={setActiveForm}
          user={user}
          boundaryGeojson={boundaryGeojson}
        />
        {hydrantsVisible && <HydrantMarkerList
          features={features}
          setPoi={setPoi}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshHidrants={refreshHidrants}
          hasLocation={!!position}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />}
        <IncidentMarkerList
          features={incidentFeatures}
          setPoi={setPoi}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          refreshIncidencies={refreshIncidencies}
          hasLocation={!!position}
        />
        {user && (
          <MapClickHandler
            onClick={(latlng) => {
              if (!isPointInBoundary(latlng.lat, latlng.lng, boundaryGeojson)) {
                toast.warning('Coordenades fora del límit de l\'ADF');
                return;
              }
              setClickedPosition(latlng);
              setActiveForm('selection');
            }}
            onCancel={() => {
              setClickedPosition(null);
              setActiveForm(null);
            }}
            isActive={!!clickedPosition}
          />
        )}
        {clickedPosition && activeForm && (
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
        <LocationMarker
          position={position}
          accuracy={accuracy}
          onEdit={user ? openFormAtPosition : undefined}
        />

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
            if (!isPointInBoundary(lat, lon, boundaryGeojson)) {
              toast.warning('Coordenades fora del límit de l\'ADF');
              return;
            }
            const latlng = L.latLng(lat, lon);
            setClickedPosition(latlng);
            setActiveForm('selection');
            setShowCoordModal(false);
          }}
          onLocateEdit={user ? openFormAtPosition : undefined}
          setLocatePosition={setPosition}
          setLocateAccuracy={setAccuracy}
          features={features}
        />
      </MapContainer>

      {clickedPosition && activeForm && user && (
        <Modal
          title={
            activeForm === 'selection'
              ? '📍 Selecciona una acció'
              : activeForm === 'hydrant'
              ? '📍 Nou hidrant'
              : '⚠️ Nova incidència'
          }
          onClose={() => {
            setClickedPosition(null);
            setActiveForm(null);
          }}
          nonBlocking={true}
        >
          {activeForm === 'selection' && (
            <CreationSelector
              onSelectHydrant={() => setActiveForm('hydrant')}
              onSelectIncident={() => setActiveForm('incident')}
              onClose={() => {
                setClickedPosition(null);
                setActiveForm(null);
              }}
            />
          )}
          {activeForm === 'hydrant' && (
            <NewNodeForm
              lat={clickedPosition.lat}
              lon={clickedPosition.lng}
              onClose={() => {
                setClickedPosition(null);
                setActiveForm(null);
              }}
              setNewNodeLatLng={setClickedPosition}
              refreshHidrants={refreshHidrants}
            />
          )}
          {activeForm === 'incident' && (
            <NewIncidentForm
              lat={clickedPosition.lat}
              lon={clickedPosition.lng}
              onClose={() => {
                setClickedPosition(null);
                setActiveForm(null);
                refreshIncidencies();
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
