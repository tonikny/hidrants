import L from 'leaflet';

export const hidrant_op_rev = '/images/icons/hidrant_op_rev.png';
export const hidrant_op_nrev = '/images/icons/hidrant_op_nrev.png';
export const hidrant_nop_rev = '/images/icons/hidrant_nop_rev.png';
export const hidrant_nop_nrev = '/images/icons/hidrant_nop_nrev.png';
export const hidrant_no_info = '/images/icons/hidrant_no_info.png';
export const hidrant_shadow = '/images/icons/marker-shadow.png';

function getHydrantIcon(properties: Record<string, any>): L.Icon {
  const currentYear = new Date().getFullYear();
  const ui = properties.ui_fields || {};
  const surveyDate = ui.surveyDate;
  const year = Number(surveyDate?.split('-')[0]);
  const isCurrentYear = year === currentYear;

  const isActive = ui.estat === 'Operatiu';
  const isOutOfService = ui.estat === 'Fora de servei';

  // Ruta a les icones (Leaflet en porta una per defecte)
  let iconUrl = '';

  if (isActive && isCurrentYear) iconUrl = hidrant_op_rev;
  else if (isActive) iconUrl = hidrant_op_nrev;
  else if (isOutOfService && isCurrentYear) iconUrl = hidrant_nop_rev;
  else if (isOutOfService) iconUrl = hidrant_nop_nrev;
  else iconUrl = hidrant_no_info;

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
