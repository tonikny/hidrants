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
import { setNodeUrlParam } from "../../utils/urlParams";
import type { CreateType, IncidenciaFeature } from "../../types";

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

  const handleSelectHydrantById = (id: string) => {
    const feature = features.find((f) => f.id === id);
    if (feature) {
      handleSelectNode(feature);
    }
  };

  const handleCenterCoordinates = (coords: [number, number]) => {
    window.dispatchEvent(
      new CustomEvent("map-center-node", {
        detail: { geometry: { coordinates: coords } },
      }),
    );
  };

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
    setNodeUrlParam(feature.id);
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
    setNodeUrlParam(null);
    setSelectedNode(null);
    setEditing(false);
  };

  const handleSelectIncidencia = (feature: IncidenciaFeature) => {
    setNodeUrlParam(feature.id);
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
    setNodeUrlParam(null);
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
      tabs={buildTabs({
        features,
        incidenciaFeatures,
        positions,
        onSelectNode: handleSelectNode,
        onSelectIncidencia: handleSelectIncidencia,
        onSelectHydrantById: handleSelectHydrantById,
        onRefreshHidrants: () => {
          void refreshHidrants().then(() => setNodeInfoKey((prev) => prev + 1));
        },
        onCenterCoordinates: handleCenterCoordinates,
      })}
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
