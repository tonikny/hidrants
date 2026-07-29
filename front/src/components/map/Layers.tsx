// Control de capes del mapa: base layers, overlays tècnics, hidrants i OwnTracks.
import { LayersControl, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  EffisFwiLayer, EffisMark5FdiLayer, EffisNfdrsIcLayer, IcgxBiomassLayer,
} from './layers/MeteoLayers';
import { TrackingLayer } from './TrackingLayer';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const { BaseLayer } = LayersControl;

interface LayersProps {
  activeTechnicalLayer: string | null;
  setActiveTechnicalLayer: (layer: string | null) => void;
  hydrantsVisible: boolean;
  setHydrantsVisible: (v: boolean) => void;
}

const TRACKING_STORAGE_KEY = 'hidrants_tracking_visible';
const hiddenIcon = L.divIcon({ className: '', iconSize: [0, 0], html: '<div style="width:1px;height:1px;opacity:0"></div>' });

export const Layers = ({ activeTechnicalLayer, setActiveTechnicalLayer, hydrantsVisible, setHydrantsVisible }: LayersProps) => {
  const { user } = useAuth();
  const [trackingChecked] = useState(() => localStorage.getItem(TRACKING_STORAGE_KEY) === 'true');

  useMapEvents({
    overlayadd: (e) => {
      if (e.name === 'Posicions OwnTracks') { localStorage.setItem(TRACKING_STORAGE_KEY, 'true'); return; }
      if (e.name === 'Hidrants') { setHydrantsVisible(true); return; }
      const technicalLayers = ["Risc d'incendi (FWI)", "Índex Perill (MARK-5 FDI)", "Probabilitat Ignició (NFDRS IC)", "Biomassa Arbrat (ICGC)"];
      if (technicalLayers.includes(e.name)) setActiveTechnicalLayer(e.name);
    },
    overlayremove: (e) => {
      if (e.name === 'Posicions OwnTracks') { localStorage.setItem(TRACKING_STORAGE_KEY, 'false'); return; }
      if (e.name === 'Hidrants') { setHydrantsVisible(false); return; }
      if (activeTechnicalLayer === e.name) setActiveTechnicalLayer(null);
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
      <BaseLayer checked name="OpenStreetMap">
        <TileLayer url="/tiles/osm/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={18} maxNativeZoom={18} />
      </BaseLayer>
      <BaseLayer name="OpenTopoMap">
        <TileLayer url="/tiles/opentopo/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={17} maxNativeZoom={17} />
      </BaseLayer>
      <BaseLayer name="Raster IGN">
        <TileLayer url="/tiles/ign-raster/{z}/{x}/{-y}.jpeg" attribution="&copy; IGN" maxZoom={17} maxNativeZoom={17} />
      </BaseLayer>
      <BaseLayer name="Ortoimagen IGN">
        <TileLayer url="/tiles/ign-orto/{z}/{x}/{-y}.jpeg" attribution="&copy; IGN" maxZoom={18} maxNativeZoom={18} />
      </BaseLayer>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Risc d'incendi (FWI)"} name="Risc d'incendi (FWI)"><EffisFwiLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Índex Perill (MARK-5 FDI)"} name="Índex Perill (MARK-5 FDI)"><EffisMark5FdiLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Probabilitat Ignició (NFDRS IC)"} name="Probabilitat Ignició (NFDRS IC)"><EffisNfdrsIcLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked={activeTechnicalLayer === "Biomassa Arbrat (ICGC)"} name="Biomassa Arbrat (ICGC)"><IcgxBiomassLayer /></LayersControl.Overlay>
      <LayersControl.Overlay checked name=""><Marker position={[0, 0]} icon={hiddenIcon} /></LayersControl.Overlay>
      <LayersControl.Overlay checked={hydrantsVisible} name="Hidrants"><Marker position={[0, 0]} icon={hiddenIcon} /></LayersControl.Overlay>
      {user && (
        <LayersControl.Overlay checked={trackingChecked} name="Posicions OwnTracks"><TrackingLayer /></LayersControl.Overlay>
      )}
    </LayersControl>
  );
};