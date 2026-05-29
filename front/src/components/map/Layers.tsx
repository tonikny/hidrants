import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet';
import {
  EffisFwiLayer,
  EffisMark5FdiLayer,
  EffisNfdrsIcLayer,
  IcgxBiomassLayer,
} from './layers/MeteoLayers';

const { BaseLayer } = LayersControl;

interface LayersProps {
  activeTechnicalLayer: string | null;
  setActiveTechnicalLayer: (layer: string | null) => void;
}

export const Layers = ({ activeTechnicalLayer, setActiveTechnicalLayer }: LayersProps) => {
  useMapEvents({
    overlayadd: (e) => {
      const technicalLayers = [
        "Risc d'incendi (FWI)",
        "Índex Perill (MARK-5 FDI)",
        "Probabilitat Ignició (NFDRS IC)",
        "Biomassa Arbrat (ICGC)"
      ];
      
      if (technicalLayers.includes(e.name)) {
        setActiveTechnicalLayer(e.name);
      }
    },
    overlayremove: (e) => {
      if (activeTechnicalLayer === e.name) {
        setActiveTechnicalLayer(null);
      }
    }
  });

  return (
    <LayersControl position="topright">
      <BaseLayer checked name="OpenStreetMap">
        <TileLayer
          url="/tiles/osm/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
          maxNativeZoom={18}
        />
      </BaseLayer>

      <BaseLayer name="OpenTopoMap">
        <TileLayer
          url="/tiles/opentopo/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={17}
          maxNativeZoom={17}
        />
      </BaseLayer>

      <BaseLayer name="Raster IGN">
        <TileLayer
          url="/tiles/ign-raster/{z}/{x}/{-y}.jpeg"
          attribution="&copy; Instituto Geográfico Nacional de España"
          maxZoom={17}
          maxNativeZoom={17}
        />
      </BaseLayer>
      <BaseLayer name="Ortoimagen IGN">
        <TileLayer
          url="/tiles/ign-orto/{z}/{x}/{-y}.jpeg"
          attribution="&copy; Instituto Geográfico Nacional de España"
          maxZoom={18}
          maxNativeZoom={18}
        />
      </BaseLayer>

      <LayersControl.Overlay 
        checked={activeTechnicalLayer === "Risc d'incendi (FWI)"} 
        name="Risc d'incendi (FWI)"
      >
        <EffisFwiLayer />
      </LayersControl.Overlay>

      <LayersControl.Overlay 
        checked={activeTechnicalLayer === "Índex Perill (MARK-5 FDI)"} 
        name="Índex Perill (MARK-5 FDI)"
      >
        <EffisMark5FdiLayer />
      </LayersControl.Overlay>

      <LayersControl.Overlay 
        checked={activeTechnicalLayer === "Probabilitat Ignició (NFDRS IC)"} 
        name="Probabilitat Ignició (NFDRS IC)"
      >
        <EffisNfdrsIcLayer />
      </LayersControl.Overlay>

      <LayersControl.Overlay 
        checked={activeTechnicalLayer === "Biomassa Arbrat (ICGC)"} 
        name="Biomassa Arbrat (ICGC)"
      >
        <IcgxBiomassLayer />
      </LayersControl.Overlay>
    </LayersControl>
  );
};
