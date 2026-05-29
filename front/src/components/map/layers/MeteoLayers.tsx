import type { FC } from 'react';
import { WMSTileLayer } from 'react-leaflet';
import type { WMSTileLayerProps } from 'react-leaflet';

// 🔹 Fix for missing 'time' prop in react-leaflet types
interface WMSTileLayerWithTimeProps extends WMSTileLayerProps {
  time?: string;
}
const WMSTileLayerWithTime = WMSTileLayer as FC<WMSTileLayerWithTimeProps>;

// 📊 WMS Layers

export const EffisFwiLayer = (
  p: Omit<
    WMSTileLayerProps,
    'url' | 'layers' | 'format' | 'transparent' | 'attribution'
  >
) => {
  // Avui en format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  return (
    <WMSTileLayerWithTime
      url="https://maps.effis.emergency.copernicus.eu/effis"
      layers="mf010.fwi"
      format="image/png"
      transparent
      opacity={0.75}
      attribution="© Copernicus EFFIS / MeteoFrance"
      version="1.1.1"
      time={today}
      {...p}
    />
  );
};

export const EffisMark5FdiLayer = (
  p: Omit<
    WMSTileLayerProps,
    'url' | 'layers' | 'format' | 'transparent' | 'attribution'
  >
) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <WMSTileLayerWithTime
      url="https://maps.effis.emergency.copernicus.eu/gwis"
      layers="ecmwf.mark5.fdi"
      format="image/png"
      transparent
      opacity={0.75}
      attribution="© Copernicus EFFIS / ECMWF"
      version="1.1.1"
      time={today}
      {...p}
    />
  );
};

export const EffisNfdrsIcLayer = (
  p: Omit<
    WMSTileLayerProps,
    'url' | 'layers' | 'format' | 'transparent' | 'attribution'
  >
) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <WMSTileLayerWithTime
      url="https://maps.effis.emergency.copernicus.eu/gwis"
      layers="ecmwf.nfdrs.ic"
      format="image/png"
      transparent
      opacity={0.75}
      attribution="© Copernicus EFFIS / ECMWF"
      version="1.1.1"
      time={today}
      {...p}
    />
  );
};

export const IcgxBiomassLayer = (
  p: Omit<
    WMSTileLayerProps,
    'url' | 'layers' | 'format' | 'transparent' | 'attribution'
  >
) => (
  <WMSTileLayer
    url="https://geoserveis.icgc.cat/servei/catalunya/variables-biofisiques-arbrat/wms"
    layers="biomassa_aeria_total_color_2016_2017"
    format="image/png"
    transparent
    opacity={0.7}
    attribution="© ICGC"
    {...p}
  />
);
