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
}: {
  features: HidrantFeature[];
  incidenciaFeatures: IncidenciaFeature[];
  positions: Record<string, Position>;
}): PanelTab[] {
  return [
    { id: "mapa", icon: "🗺️", label: "Mapa", content: <MapaTab /> },
    {
      id: "seguiment",
      icon: "👣",
      label: "Seguiment",
      content: <SeguimentTab positions={positions} />,
    },
    {
      id: "informes",
      icon: "📃",
      label: "Informes",
      content: <InformesTab features={features} incidenciaFeatures={incidenciaFeatures} />,
    },
    { id: "usuaris", icon: "👤", label: "Usuaris", content: <UsuarisTab /> },
    { id: "config", icon: "⚙️", label: "Configuració", content: <ConfigTab /> },
    { id: "ajuda", icon: "📖", label: "Ajuda", content: <AjudaTab /> },
  ];
}
