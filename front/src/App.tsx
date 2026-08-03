import { useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/map/LeafletMap';
import { AdfProvider, useAdf } from './contexts/AdfContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Panel, type BottomSheetHandle } from './components/ui/Panel';
import { buildTabs } from './components/ui/PanelTabs';
import { useHydrantData } from './hooks/useHidrantData';
import { useIncidencies } from './hooks/useIncidencies';
import { usePositionPolling } from './hooks/usePositionPolling';
import { NodeInfo } from './components/ui/NodeForm';

function setUrlNodeParam(nodeId: string | null) {
  const url = new URL(window.location.href);
  if (nodeId) url.searchParams.set('node', nodeId);
  else url.searchParams.delete('node');
  window.history.replaceState({}, '', url.toString());
}

function AppContent() {
  const { isLoading, activeAdf } = useAdf();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [editing, setEditing] = useState(false);
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
    setEditing(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('map-center-node', { detail: feature }));
    }, 400);
  };

  const handleDeselectNode = () => {
    setUrlNodeParam(null);
    setSelectedNode(null);
    setEditing(false);
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
          refreshIncidencies={refreshIncidencies}
          positions={positions}
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
