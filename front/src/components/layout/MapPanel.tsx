import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type L from "leaflet";
import { LeafletMap } from "../map/LeafletMap";
import { useAdf } from "../../contexts/AdfContext";
import { useAuth } from "../../contexts/AuthContext";
import { Panel, type BottomSheetHandle } from "./Panel";
import { buildTabs } from "../panel/PanelTabs";
import { useHydrantData } from "../../hooks/useHidrantData";
import type { HidrantFeature } from "../../hooks/useHidrantData";
import { useIncidencies } from "../../hooks/useIncidencies";
import { usePositionPolling } from "../../hooks/usePositionPolling";
import { NodeInfo } from "../hidrants/NodeInfo";
import { CreateNodePanel } from "../panel/CreateNodePanel";
import { createTitle } from "../panel/createTitle";
import { IncidenciaInfo } from "../incidencies/IncidenciaInfo";
import { isPointInBoundary } from "../../utils/geo";
import { emojiPrioritatIncidencia } from "../../utils/incidenciaConstants";
import { confirmDiscardChanges } from "../../utils/formDirty";
import type { CreateType, IncidenciaFeature } from "../../types";

function setUrlNodeParam(nodeId: string | null) {
  const url = new URL(window.location.href);
  if (nodeId) {
    url.searchParams.set("node", nodeId);
  } else {
    url.searchParams.delete("node");
  }
  window.history.replaceState({}, "", url.toString());
}

export function MapPanel() {
  const { isLoading, activeAdf, boundaryGeojson } = useAdf();
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<HidrantFeature | null>(null);
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaFeature | null>(null);
  const [editing, setEditing] = useState(false);
  const [createPos, setCreatePos] = useState<L.LatLng | null>(null);
  const [createForm, setCreateForm] = useState<CreateType>(null);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [nodeInfoKey, setNodeInfoKey] = useState(0); // Nova clau per forzar re-render
  const sheetRef = useRef<BottomSheetHandle>(null);

  const {
    features,
    loading: loadingHidrants,
    error: hidrantsError,
    mutate: refreshHidrants,
  } = useHydrantData();

  const {
    features: incidenciaFeatures,
    loading: loadingIncidencies,
    refresh: refreshIncidencies,
  } = useIncidencies();

  const positions = usePositionPolling(15000);

  // Seleccionar hidrant per ID des de la llista de sync (cercle + info)
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      const feature = features.find((f) => f.id === id);
      if (feature) {
        setUrlNodeParam(feature.id);
        setSelectedNode(feature);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("map-center-node", { detail: feature }));
        }, 400);
      }
    };
    window.addEventListener("select-hydrant-by-id", handler);
    return () => window.removeEventListener("select-hydrant-by-id", handler);
  }, [features]);

  // Refrescar hidrants des de la llista de sync
  useEffect(() => {
    const handler = () => {
      // Només forçar re-render i actualitzar dades del backend
      setNodeInfoKey((prev) => prev + 1);
      void refreshHidrants();
    };
    window.addEventListener("refresh-hidrants", handler);
    return () => window.removeEventListener("refresh-hidrants", handler);
  }, []);

  // Actualitzar selectedNode quan features canvia (després de refreshHidrants)
  /* eslint-disable react-hooks/set-state-in-effect -- actualització necessària quan canvien les dades */
  useEffect(() => {
    if (selectedNode) {
      const updatedFeature = features.find((f) => f.id === selectedNode.id);
      if (updatedFeature && updatedFeature !== selectedNode) {
        setSelectedNode(updatedFeature);
      }
    }
  }, [features, selectedNode]);

  // Re-selecció del node després de guardar/descarregar/pushejar
  // Per actualitzar els valors inicials del formulari d'edició
  useEffect(() => {
    const handler = (e: Event) => {
      const nodeId = (e as CustomEvent).detail as string;
      const feature = features.find((f) => f.id === nodeId);
      if (feature) {
        setSelectedNode(feature);
        setUrlNodeParam(feature.id);
      }
    };
    window.addEventListener("re-select-node", handler);
    return () => window.removeEventListener("re-select-node", handler);
  }, [features]);

  useEffect(() => {
    if (!createPos) {
      return;
    }
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("map-center-node", {
          detail: { geometry: { coordinates: [createPos.lng, createPos.lat] }, keepZoom: true },
        }),
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [createPos]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregant...</div>;
  }

  const canEdit = !!user && (user.role === "admin" || user.adf_id === activeAdf?.id);

  const handleSelectNode = (feature: HidrantFeature) => {
    if (!confirmDiscardChanges()) {
      return;
    }
    setUrlNodeParam(feature.id);
    setSelectedNode(feature);
    setSelectedIncidencia(null);
    setEditing(false);
    setCreatePos(null);
    setCreateForm(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("map-center-node", { detail: feature }));
    }, 400);
  };

  const handleDeselectNode = () => {
    if (!confirmDiscardChanges()) {
      return;
    }
    setUrlNodeParam(null);
    setSelectedNode(null);
    setEditing(false);
  };

  const handleSelectIncidencia = (feature: IncidenciaFeature) => {
    if (!confirmDiscardChanges()) {
      return;
    }
    setUrlNodeParam(feature.id);
    setSelectedIncidencia(feature);
    setSelectedNode(null);
    setEditing(false);
    setCreatePos(null);
    setCreateForm(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("map-center-node", { detail: feature }));
    }, 400);
  };

  const handleDeselectIncidencia = () => {
    if (!confirmDiscardChanges()) {
      return;
    }
    setUrlNodeParam(null);
    setSelectedIncidencia(null);
    setEditing(false);
  };

  const closeCreate = () => {
    setCreatePos(null);
    setCreateForm(null);
  };

  const openCreate = (latlng: L.LatLng) => {
    if (!user) {
      return;
    }
    if (!isPointInBoundary(latlng.lat, latlng.lng, boundaryGeojson)) {
      toast.warning("Coordenades fora del límit de l'ADF");
      return;
    }
    handleDeselectNode();
    setCreatePos(latlng);
    setCreateForm("selection");
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
          refreshHidrants={() => {
            void refreshHidrants();
          }}
          incidenciaFeatures={incidenciaFeatures}
          loadingIncidencies={loadingIncidencies}
          selectedIncidenciaId={selectedIncidencia?.id}
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
              id: selectedNode.id,
              content: (
                <NodeInfo
                  key={nodeInfoKey}
                  feature={selectedNode}
                  canEdit={canEdit}
                  editing={editing}
                  setEditing={setEditing}
                  refreshHidrants={() => refreshHidrants()}
                  showRoute={showRoute}
                  setShowRoute={setShowRoute}
                  hasLocation={!!position}
                />
              ),
              onClose: handleDeselectNode,
              onEdit: canEdit ? () => setEditing((prev) => !prev) : undefined,
              editing,
            }
          : selectedIncidencia
            ? {
                id: selectedIncidencia.id,
                title: `${emojiPrioritatIncidencia(selectedIncidencia.properties.prioritat)} ${selectedIncidencia.properties.titol}`,
                content: (
                  <IncidenciaInfo
                    key={selectedIncidencia.id}
                    incidencia={selectedIncidencia}
                    canEdit={canEdit}
                    editing={editing}
                    setEditing={setEditing}
                    showRoute={showRoute}
                    setShowRoute={setShowRoute}
                    refreshIncidencies={() => {
                      void refreshIncidencies();
                    }}
                    hasLocation={!!position}
                  />
                ),
                onClose: handleDeselectIncidencia,
                onEdit: canEdit ? () => setEditing((prev) => !prev) : undefined,
                editing,
              }
            : createPos && createForm && user
              ? {
                  id: "create",
                  title: createTitle(createForm),
                  content: (
                    <CreateNodePanel
                      form={createForm}
                      position={createPos}
                      setForm={setCreateForm}
                      onClose={closeCreate}
                      setNewNodeLatLng={setCreatePos}
                      refreshHidrants={() => {
                        void refreshHidrants();
                      }}
                      refreshIncidencies={() => {
                        void refreshIncidencies();
                      }}
                    />
                  ),
                  onClose: closeCreate,
                }
              : null
      }
    />
  );
}
