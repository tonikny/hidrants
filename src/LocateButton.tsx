import { Marker, useMap } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';
import { toast } from 'react-toastify';

export function LocateButton() {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error('El teu navegador no suporta geolocalització');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng = L.latLng(latitude, longitude);
        setPosition(latlng);
        map.setView(latlng, 16); // centra i fa zoom
      },
      () => {
        toast.error("No s'ha pogut obtenir la teva posició");
      }
    );
  };

  return (
    <>
      <button
        onClick={locateUser}
        style={{
          position: 'absolute',
          bottom: '5rem',
          left: '1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        title="Centra el mapa a la teva posició"
      >
        📍
      </button>

      {position && (
        <Marker
          position={position}
          icon={L.icon({
            iconUrl: '/images/icons/marker-icon-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41],
          })}
        />
      )}
    </>
  );
}
