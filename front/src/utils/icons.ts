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

  // Ruta a les icones
  let iconUrl = '';

  // Cas 1: No hi ha data de revisió -> Gris (No info)
  if (!surveyDate) {
    iconUrl = hidrant_no_info;
  } 
  // Cas 2: Operatiu i d'aquest any -> Blau intens
  else if (isActive && isCurrentYear) {
    iconUrl = hidrant_op_rev;
  }
  // Cas 3: Operatiu però d'anys anteriors -> Blau apagat
  else if (isActive) {
    iconUrl = hidrant_op_nrev;
  }
  // Cas 4: Fora de servei i d'aquest any -> Vermell intens
  else if (isOutOfService && isCurrentYear) {
    iconUrl = hidrant_nop_rev;
  }
  // Cas 5: Fora de servei d'anys anteriors -> Vermell apagat
  else if (isOutOfService) {
    iconUrl = hidrant_nop_nrev;
  }
  // Cas 6: Qualsevol altre cas (ex: Desconegut amb data) -> Gris
  else {
    iconUrl = hidrant_no_info;
  }

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
