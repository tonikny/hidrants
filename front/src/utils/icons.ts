import L from 'leaflet';
import type { HydrantUiFields } from './osmConversion';
import type { HidrantFeature } from '../hooks/useHidrantData';
import type { Incidencia } from '../types';

export const hidrant_op_rev = '/images/icons/hidrant_op_rev.png';
export const hidrant_op_nrev = '/images/icons/hidrant_op_nrev.png';
export const hidrant_nop_rev = '/images/icons/hidrant_nop_rev.png';
export const hidrant_nop_nrev = '/images/icons/hidrant_nop_nrev.png';
export const hidrant_no_info = '/images/icons/hidrant_no_info.png';
export const hidrant_shadow = '/images/icons/marker-shadow.png';

export function getHydrantStatus(ui: Pick<HydrantUiFields, 'surveyDate' | 'estat'>) {
  const currentYear = new Date().getFullYear();
  const surveyDate = ui.surveyDate;
  const year = Number(surveyDate?.split('-')[0]);
  const isCurrentYear = year === currentYear;

  const isActive = ui.estat === 'Operatiu';
  const isOutOfService = ui.estat === 'Fora de servei';

  if (!surveyDate) {return 'no_info';}
  if (isActive && isCurrentYear) {return 'op_rev';}
  if (isActive) {return 'op_nrev';}
  if (isOutOfService && isCurrentYear) {return 'nop_rev';}
  if (isOutOfService) {return 'nop_nrev';}
  return 'no_info';
}

export function getHydrantIconUrl(status: string) {
  switch (status) {
    case 'op_rev': return hidrant_op_rev;
    case 'op_nrev': return hidrant_op_nrev;
    case 'nop_rev': return hidrant_nop_rev;
    case 'nop_nrev': return hidrant_nop_nrev;
    default: return hidrant_no_info;
  }
}

function getHydrantIcon(properties: Pick<HidrantFeature['properties'], 'ui_fields'>): L.Icon {
  const ui = properties.ui_fields || {};
  const status = getHydrantStatus(ui);
  const iconUrl = getHydrantIconUrl(status);

  return new L.Icon({
    iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: hidrant_shadow,
    shadowSize: [41, 41],
  });
}

export function getIncidenciaIcon(properties: Incidencia): L.DivIcon {
  const tipus = properties.tipus?.toUpperCase();
  const prioritat = properties.prioritat?.toUpperCase();
  
  let emoji = '⚠️';
  if (tipus === 'FOC') {emoji = '🔥';}
  else if (tipus === 'FUM') {emoji = '💨';}
  else if (tipus === 'ACCIDENT') {emoji = '🚗';}
  
  const shadow = prioritat === 'ALTA' ? '0 0 10px red' : '0 0 5px orange';
  
  return L.divIcon({
    className: 'incidencia-marker',
    html: `<div style="font-size: 28px; display: flex; justify-content: center; align-items: center; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5)); text-shadow: ${shadow};">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
}

export default getHydrantIcon;
