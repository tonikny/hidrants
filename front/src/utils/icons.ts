import L from 'leaflet';

export const hidrant_op_rev = '/images/icons/hidrant_op_rev.png';
export const hidrant_op_nrev = '/images/icons/hidrant_op_nrev.png';
export const hidrant_nop_rev = '/images/icons/hidrant_nop_rev.png';
export const hidrant_nop_nrev = '/images/icons/hidrant_nop_nrev.png';
export const hidrant_no_info = '/images/icons/hidrant_no_info.png';
export const hidrant_shadow = '/images/icons/marker-shadow.png';

export function getHydrantStatus(ui: any) {
  const currentYear = new Date().getFullYear();
  const surveyDate = ui.surveyDate;
  const year = Number(surveyDate?.split('-')[0]);
  const isCurrentYear = year === currentYear;

  const isActive = ui.estat === 'Operatiu';
  const isOutOfService = ui.estat === 'Fora de servei';

  if (!surveyDate) return 'no_info';
  if (isActive && isCurrentYear) return 'op_rev';
  if (isActive) return 'op_nrev';
  if (isOutOfService && isCurrentYear) return 'nop_rev';
  if (isOutOfService) return 'nop_nrev';
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

function getHydrantIcon(properties: Record<string, any>): L.Icon {
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

export default getHydrantIcon;
