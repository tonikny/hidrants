import { useEffect, useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/map/LeafletMap';
import { AdfProvider, useAdf } from './contexts/AdfContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Panel, type BottomSheetHandle } from './components/layout/Panel';
import { buildTabs } from './components/panel/PanelTabs';
import { useHydrantData } from './hooks/useHidrantData';
import { useIncidencies } from './hooks/useIncidencies';
import { usePositionPolling } from './hooks/usePositionPolling';
import { NodeInfo } from './components/hidrants/NodeInfo';
import { CreateNodePanel, createTitle } from './components/panel/CreateNodePanel';
import { IncidenciaPopup } from './components/incidents/IncidenciaPopup';
import { isPointInBoundary } from './utils/geo';
import { toast } from 'react-toastify';
import L from 'leaflet';
import type { CreateType, IncidenciaFeature } from './types';

function setUrlNodeParam(nodeId: string | null) {
  const url = new URL(window.location.href);
  if (nodeId) url.searchParams.set('node', nodeId);
  else url.searchParams.delete('node');
  window.history.replaceState({}, '', url.toString());
}

function AppContent() {
  const { isLoading, activeAdf, boundaryGeojson } = useAdf();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaFeature | null>(null);
  const [editing, setEditing] = useState(false);
  const [createPos, setCreatePos] = useState<L.LatLng | null>(null);
  const [createForm, setCreateForm] = useState<CreateType>(null);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const {
    features,
    loading: loadingHidrants,
    error: hidrantsError,
    mutate: refreshHidrants,
  } = useHydrantData(null, 0);

  const {
    features: incidenciaFeatures,
    refresh: refreshIncidencies,
  } = useIncidencies();

  const positions = usePositionPolling(15000);

  useEffect(() => {
    if (!createPos) return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('map-center-node', {
        detail: { geometry: { coordinates: [createPos.lng, createPos.lat] } },
      }));
    }, 400);
    return () => clearTimeout(timer);
  }, [createPos]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregant...
      </div>
    );
  }

  const canEdit =
    !!user &&
    (user.role === 'admin' ||
      (user.role === 'editor' && user.adf_id === activeAdf?.id));

  const handleSelectNode = (feature: any) => {
    setUrlNodeParam(feature.id);
    setSelectedNode(feature);
    setSelectedIncidencia(null);
    setEditing(false);
    setCreatePos(null);
    setCreateForm(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('map-center-node', { detail: feature }));
    }, 400);
  };

  const handleDeselectNode = () => {
    setUrlNodeParam(null);
    setSelectedNode(null);
    setEditing(false);
  };

  const handleSelectIncidencia = (feature: IncidenciaFeature) => {
    setSelectedIncidencia(feature);
    setSelectedNode(null);
    setEditing(false);
    setCreatePos(null);
    setCreateForm(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('map-center-node', { detail: feature }));
    }, 400);
  };

  const handleDeselectIncidencia = () => {
    setSelectedIncidencia(null);
  };

  const closeCreate = () => {
    setCreatePos(null);
    setCreateForm(null);
  };

  const openCreate = (latlng: L.LatLng) => {
    if (!user) return;
    if (!isPointInBoundary(latlng.lat, latlng.lng, boundaryGeojson)) {
      toast.warning('Coordenades fora del límit de l\'ADF');
      return;
    }
    handleDeselectNode();
    setCreatePos(latlng);
    setCreateForm('selection');
  };

  return (
    <Panel
      sheetRef={sheetRef}
      map={
        <LeafletMap
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedNode?.id}
          onMapClick={() => sheetRef.current?.close()}
          features={features}
          loadingHidrants={loadingHidrants}
          hidrantsError={hidrantsError}
          refreshHidrants={refreshHidrants}
          incidenciaFeatures={incidenciaFeatures}
          positions={positions}
          position={position}
          setPosition={setPosition}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          createPos={createPos}
          createForm={createForm}
          onOpenCreate={openCreate}
          onCloseCreate={closeCreate}
          onSelectIncidencia={handleSelectIncidencia}
        />
      }
      tabs={buildTabs({ features, incidenciaFeatures, positions })}
      node={
        selectedNode
          ? {
              content: (
                <NodeInfo
                  feature={selectedNode}
                  canEdit={canEdit}
                  editing={editing}
                  setEditing={setEditing}
                />
              ),
              onClose: handleDeselectNode,
              onEdit: canEdit ? () => setEditing(true) : undefined,
              showDelete: canEdit && user.role === 'admin',
            }
          : selectedIncidencia
            ? {
                title: '⚠️ Incidència',
                content: (
                  <div className="p-3">
                    <IncidenciaPopup
                      incidenciaId={selectedIncidencia.id}
                      showRoute={showRoute}
                      setShowRoute={setShowRoute}
                      refreshIncidencies={refreshIncidencies}
                      hasLocation={!!position}
                    />
                  </div>
                ),
                onClose: handleDeselectIncidencia,
              }
            : createPos && createForm && user
            ? {
                title: createTitle(createForm),
                content: (
                  <CreateNodePanel
                    form={createForm}
                    position={createPos}
                    setForm={setCreateForm}
                    onClose={closeCreate}
                    setNewNodeLatLng={setCreatePos}
                    refreshHidrants={refreshHidrants}
                    refreshIncidencies={refreshIncidencies}
                  />
                ),
                onClose: closeCreate,
              }
            : null
      }
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdfProvider>
        <AppContent />
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      </AdfProvider>
    </AuthProvider>
  );
}
