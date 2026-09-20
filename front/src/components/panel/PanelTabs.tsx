import type { PanelTab } from "../layout/Panel";
import type { HidrantFeature } from "../../hooks/useHidrantData";
import type { IncidenciaFeature } from "../../types";
import type { Position } from "../../hooks/usePositionPolling";
import { MapaTab } from "./tabs/MapaTab";
import { SeguimentTab } from "./tabs/SeguimentTab";
import { InformesTab } from "./tabs/InformesTab";
import { UsuarisTab } from "./tabs/UsuarisTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { AjudaTab } from "./tabs/AjudaTab";

export function buildTabs({
  features,
  incidenciaFeatures,
  positions,
  onSelectNode,
  onSelectIncidencia,
  onSelectHydrantById,
  onRefreshHidrants,
  onCenterCoordinates,
}: {
  features: HidrantFeature[];
  incidenciaFeatures: IncidenciaFeature[];
  positions: Record<string, Position>;
  onSelectNode?: (feature: HidrantFeature) => void;
  onSelectIncidencia?: (feature: IncidenciaFeature) => void;
  onSelectHydrantById?: (id: string) => void;
  onRefreshHidrants?: () => void;
  onCenterCoordinates?: (coords: [number, number]) => void;
}): PanelTab[] {
  return [
    {
      id: "mapa",
      icon: "🗺️",
      label: "ADF",
      content: <MapaTab onSelectHydrant={onSelectHydrantById} onRefresh={onRefreshHidrants} />,
    },
    {
      id: "seguiment",
      icon: "👣",
      label: "Seguiment",
      content: <SeguimentTab positions={positions} onCenterCoordinates={onCenterCoordinates} />,
    },
    {
      id: "informes",
      icon: "📃",
      label: "Informes",
      content: (
        <InformesTab
          features={features}
          incidenciaFeatures={incidenciaFeatures}
          onSelectNode={onSelectNode}
          onSelectIncidencia={onSelectIncidencia}
        />
      ),
    },
    { id: "usuaris", icon: "👤", label: "Usuaris", content: <UsuarisTab /> },
    { id: "config", icon: "⚙️", label: "Configuració", content: <ConfigTab /> },
    { id: "ajuda", icon: "📖", label: "Ajuda", content: <AjudaTab /> },
  ];
}
