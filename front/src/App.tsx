import { useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/map/LeafletMap';
import { AdfProvider, useAdf } from './contexts/AdfContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Panel, PanelContent, type BottomSheetHandle, type PanelTab } from './components/ui/Panel';
import { NodeInfo } from './components/ui/NodeForm';

const tabs: PanelTab[] = [
  {
    id: 'llista',
    icon: '📋',
    label: 'Llista',
    content: <PanelContent />,
  },
  {
    id: 'mapa',
    icon: '🗺️',
    label: 'Mapa',
    content: (
      <div className="p-4 text-[0.85rem] text-muted">
        Contingut de la pestanya Mapa (placeholder).
      </div>
    ),
  },
  {
    id: 'config',
    icon: '⚙️',
    label: 'Configuració',
    content: (
      <div className="p-4 text-[0.85rem] text-muted">
        Contingut de la pestanya Configuració (placeholder).
      </div>
    ),
  },
];

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
        />
      }
      tabs={tabs}
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
