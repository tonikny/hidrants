import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

export function Legend() {
  const map = useMap();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const legend = L.control.attribution({
      position: 'bottomright',
    });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '0 20px 10px 20px';
      div.style.opacity = '70%';
      const style = 'display: flex;align-items: center;gap:15px';
      div.innerHTML = `
        <h4>Hidrants</h4>
        <div style="${style}"><img src="/icons/marker-icon-blue.png" /> Operatiu (revisat ${currentYear})</div>
        <div style="${style}"><img src="/icons/marker-icon-grey.png" /> Operatiu (no revisat)</div>
        <div style="${style}"><img src="/icons/marker-icon-red.png" /> Fora de servei (${currentYear})</div>
        <div style="${style}"><img src="/icons/marker-icon-orange.png" /> Fora de servei (no revisat)</div>
      `;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}
