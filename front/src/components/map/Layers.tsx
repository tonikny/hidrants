// Control de capes del mapa: base layers, overlays tècnics, hidrants i OwnTracks.
import { LayersControl, TileLayer, useMapEvents, LayerGroup } from 'react-leaflet';
import {
  EffisFwiLayer, EffisMark5FdiLayer, EffisNfdrsIcLayer, IcgxBiomassLayer,
} from './layers/MeteoLayers';
import { TrackingLayer } from './TrackingLayer';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalStorage } from '../../utils/useLocalStorage';

const { BaseLayer } = LayersControl;

interface LayersProps {
  activeTechnicalLayer: string | null;
  setActiveTechnicalLayer: (layer: string | null) => void;
  hydrantsVisible: boolean;
  setHydrantsVisible: (v: boolean) => void;
  incidenciesVisible: boolean;
  setIncidenciesVisible: (v: boolean) => void;
  baseLayer: string;
  setBaseLayer: (layer: string) => void;
  positions: Record<string, { lat: number; lon: number; accuracy: number; timestamp: number; battery: number; receivedAt: number }>;
}

const TRACKING_STORAGE_KEY = 'hidrants_tracking_visible';

export const Layers = ({ activeTechnicalLayer, setActiveTechnicalLayer, hydrantsVisible, setHydrantsVisible, incidenciesVisible, setIncidenciesVisible, baseLayer, setBaseLayer, positions }: LayersProps) => {
  const { user } = useAuth();
  const [trackingChecked, setTrackingChecked] = useLocalStorage<boolean>(TRACKING_STORAGE_KEY, false);

  useMapEvents({
    baselayerchange: (e) => {
      setBaseLayer(e.name);
    },
    overlayadd: (e) => {
      if (e.name === 'Posicions OwnTracks') { setTrackingChecked(true); return; }
      if (e.name === 'Hidrants') { setHydrantsVisible(true); return; }
      if (e.name === 'Incidències') { setIncidenciesVisible(true); return; }
      const technicalLayers = ["Risc d'incendi (FWI)", "Índex Perill (MARK-5 FDI)", "Probabilitat Ignició (NFDRS IC)", "Biomassa Arbrat (ICGC)"];
      if (technicalLayers.includes(e.name)) {setActiveTechnicalLayer(e.name);}
    },
    overlayremove: (e) => {
      if (e.name === 'Posicions OwnTracks') { setTrackingChecked(false); return; }
      if (e.name === 'Hidrants') { setHydrantsVisible(false); return; }
      if (e.name === 'Incidències') { setIncidenciesVisible(false); return; }
      if (activeTechnicalLayer === e.name) {setActiveTechnicalLayer(null);}
    }
  });

  return (
    <LayersControl position="topright">
      <style>{`
        .leaflet-control-layers-overlays label:nth-child(5) {
          pointer-events: none; border-bottom: 1px solid #ccc;
          margin: 4px 0 6px; padding-bottom: 2px;
        }
        .leaflet-control-layers-overlays label:nth-child(5) input,
        .leaflet-control-layers-overlays label:nth-child(5) span { display: none; }
      `}</style>
      <BaseLayer checked={baseLayer === 'OpenStreetMap'} name="OpenStreetMap">
        <TileLayer url="/tiles/osm/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={18} maxNativeZoom={18} />
      </BaseLayer>
      <BaseLayer checked={baseLayer === 'OpenTopoMap'} name="OpenTopoMap">
        <TileLayer url="/tiles/opentopo/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={17} maxNativeZoom={17} />
      </BaseLayer>
      <BaseLayer checked={baseLayer === 'Raster IGN'} name="Raster IGN">
        <TileLayer url="/tiles/ign-raster/{z}/{x}/{-y}.jpeg" attribution="&copy; IGN" maxZoom={17} maxNativeZoom={17} />
      </BaseLayer>
      <BaseLayer checked={baseLayer === 'Ortoimagen IGN'} name="Ortoimagen IGN">
        <TileLayer url="/tiles/ign-orto/{z}/{x}/{-y}.jpeg" attribution="&copy; IGN" maxZoom={18} maxNativeZoom={18} />
      </BaseLayer>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Risc d'incendi (FWI)"} name="Risc d'incendi (FWI)"><EffisFwiLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Índex Perill (MARK-5 FDI)"} name="Índex Perill (MARK-5 FDI)"><EffisMark5FdiLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Probabilitat Ignició (NFDRS IC)"} name="Probabilitat Ignició (NFDRS IC)"><EffisNfdrsIcLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Biomassa Arbrat (ICGC)"} name="Biomassa Arbrat (ICGC)"><IcgxBiomassLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked name=""><LayerGroup /></LayersControl.Overlay>
      <LayersControl.Overlay checked={incidenciesVisible} name="Incidències"><LayerGroup /></LayersControl.Overlay>
      <LayersControl.Overlay checked={hydrantsVisible} name="Hidrants"><LayerGroup /></LayersControl.Overlay>
      {user && (
        <LayersControl.Overlay checked={trackingChecked} name="Posicions OwnTracks"><TrackingLayer positions={positions} /></LayersControl.Overlay>
      )}
    </LayersControl>
  );
};