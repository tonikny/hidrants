import { LayersControl, TileLayer } from 'react-leaflet';
import IncedenciesLayer from './IncidenciesLayer';

const { BaseLayer, Overlay } = LayersControl;

export const Layers = () => (
  <LayersControl position="topright">
    <BaseLayer checked name="OpenStreetMap">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={18}
        maxNativeZoom={18}
      />
    </BaseLayer>

    <BaseLayer name="OpenTopoMap">
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={17}
        maxNativeZoom={17}
      />
    </BaseLayer>

    <BaseLayer name="Raster IGN">
      <TileLayer
        url="https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg"
        attribution="&copy; Instituto Geográfico Nacional de España"
        maxZoom={17}
        maxNativeZoom={17}
      />
    </BaseLayer>
    <BaseLayer name="Ortoimagen IGN">
      <TileLayer
        url="https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg"
        attribution="&copy; Instituto Geográfico Nacional de España"
        maxZoom={18}
        maxNativeZoom={18}
      />
    </BaseLayer>
    {/* <IncedenciesLayer active /> */}
  </LayersControl>
);
