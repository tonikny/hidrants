import L from 'leaflet';

function getHydrantColorIcon(properties: Record<string, any>): L.DivIcon {
  const currentYear = new Date().getFullYear();
  const surveyDate = properties['survey:date'];
  //   const isCurrentYear = surveyDate?.startsWith(String(currentYear));
  const year = Number(surveyDate?.split('-')[0]);
  const isCurrentYear = year === currentYear;

  const isActive = properties['emergency'] === 'fire_hydrant';
  const isDisused = properties['disused:emergency'] === 'fire_hydrant';

  let color = 'gray';

  if (isActive) {
    color = isCurrentYear ? '#003366' : '#66ccff'; // Blau fosc o clar
  } else if (isDisused) {
    color = isCurrentYear ? '#cc0000' : '#ff9900'; // Vermell o taronja
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default getHydrantColorIcon;
