import L from 'leaflet';

function getHydrantIcon(properties: Record<string, any>): L.Icon {
  const currentYear = new Date().getFullYear();
  const surveyDate = properties['survey:date'];
  const year = Number(surveyDate?.split('-')[0]);
  const isCurrentYear = year === currentYear;

  const isActive = properties['emergency'] === 'fire_hydrant';
  const isDisused = properties['disused:emergency'] === 'fire_hydrant';

  // Ruta a les icones (Leaflet en porta una per defecte)
  let iconUrl = '';

  if (isActive && isCurrentYear) iconUrl = '/icons/marker-icon-blue.png';
  else if (isActive) iconUrl = '/icons/marker-icon-grey.png';
  else if (isDisused && isCurrentYear) iconUrl = '/icons/marker-icon-red.png';
  else iconUrl = '/icons/marker-icon-orange.png';

  return new L.Icon({
    iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/icons/marker-shadow.png',
    shadowSize: [41, 41],
  });
}

export default getHydrantIcon;
