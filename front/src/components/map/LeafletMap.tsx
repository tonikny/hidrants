import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { MapClickHandler } from './MapClickHandler';
import MapRightClickHandler from './MapRightClickHandler';
import { Layers } from './Layers';
import MaskedAreaMap from './MaskedAreaMap';
import { RouteLayer } from './RouteLayer';
import { useAdf } from '../../contexts/AdfContext';
import { useAuth } from '../../contexts/AuthContext';
import { HydrantMarkerList } from './markers/HydrantMarkerList';
import { MapUrlHandler } from './MapUrlHandler';
import { MapUIOverlays } from '../controls/MapUIOverlays';
import { LocationMarker } from './LocationMarker';

import { IncidenciaMarkerList } from './markers/IncidenciaMarkerList';
import type { HidrantFeature } from '../../hooks/useHidrantData';
import type { IncidenciaFeature, CreateType } from '../../types';

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

// ✅ Component per escoltar clics al mapa i informar al pare
function MapStateListener({ onMapClick }: { onMapClick?: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick?.();
    },
  });

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
export function LeafletMap({
  onSelectNode,
  onMapClick,
  selectedNodeId,
  features,
  loadingHidrants,
  hidrantsError,
  refreshHidrants,
  incidenciaFeatures,
  loadingIncidencies,
  positions,
  position,
  setPosition,
  showRoute,
  setShowRoute,
  createPos,
  createForm,
  onOpenCreate,
  onCloseCreate,
  onSelectIncidencia,
}: {
  onSelectNode?: (f: any) => void;
  onMapClick?: () => void;
  selectedNodeId?: string | null;
  features: HidrantFeature[];
  loadingHidrants: boolean;
  hidrantsError: string | null;
  refreshHidrants: () => void;
  incidenciaFeatures: IncidenciaFeature[];
  loadingIncidencies: boolean;
  positions: Record<string, { lat: number; lon: number; accuracy: number; timestamp: number; battery: number; receivedAt: number }>;
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng | null) => void;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  createPos: L.LatLng | null;
  createForm: CreateType;
  onOpenCreate: (latlng: L.LatLng) => void;
  onCloseCreate: () => void;
  onSelectIncidencia: (f: IncidenciaFeature) => void;
}) {
  const { activeAdf, isLoading } = useAdf();
  const { user } = useAuth();
  const [activeTechnicalLayer, setActiveTechnicalLayer] = useState<
    string | null
  >(null);
  const [hydrantsVisible, setHydrantsVisible] = useState(true);

  const [showCoordModal, setShowCoordModal] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [poi, setPoi] = useState<LatLng | null>(null);

  const openFormAtPosition = (latlng: L.LatLng) => {
    onOpenCreate(latlng);
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
        <MapUrlHandler
          features={features}
          incidenciaFeatures={incidenciaFeatures}
          loadingHidrants={loadingHidrants}
          loadingIncidencies={loadingIncidencies}
          onSelectIncidencia={onSelectIncidencia}
        />
        <MapStateListener onMapClick={onMapClick} />
        <MaskedAreaMap hidden={!!activeTechnicalLayer} />
        <Layers
          activeTechnicalLayer={activeTechnicalLayer}
          setActiveTechnicalLayer={setActiveTechnicalLayer}
          hydrantsVisible={hydrantsVisible}
          setHydrantsVisible={setHydrantsVisible}
          positions={positions}
        />
        <MapRightClickHandler
          onCreate={onOpenCreate}
          user={user}
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
        <IncidenciaMarkerList
          features={incidenciaFeatures}
          setPoi={setPoi}
          onSelectIncidencia={onSelectIncidencia}
        />
        {user && (
          <MapClickHandler
            onClick={onOpenCreate}
            onCancel={onCloseCreate}
            isActive={!!createPos}
          />
        )}
        {createPos && createForm && (
          <Marker
            position={createPos}
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
          loadingHidrants={loadingHidrants}
          hidrantsError={hidrantsError}
          showCoordModal={showCoordModal}
          setShowCoordModal={setShowCoordModal}
          onCoordinateConfirm={(lat, lon) => {
            onOpenCreate(L.latLng(lat, lon));
            setShowCoordModal(false);
          }}
          onLocateEdit={user ? openFormAtPosition : undefined}
          setLocatePosition={setPosition}
          setLocateAccuracy={setAccuracy}
        />
      </MapContainer>
    </>
  );
}
