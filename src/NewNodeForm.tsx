import { useEffect, useState } from 'react';
import { sendToTelegram } from './sendToTelegram';
import { useMap, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';

type NodeFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
};

export const NewNodeForm = ({ lat, lon, onClose }: NodeFormProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendToTelegram({ lat, lon, message });
      alert('Missatge enviat!');
      setMessage('');
      onClose();
    } catch (err) {
      console.log(err);
      alert('Error enviant el missatge');
    }
  };
  return (
    <div
      className="form-popup"
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: '#fff',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <form onSubmit={handleSubmit}>
        <p>
          <strong>Nova proposta de node</strong>
        </p>
        <p>
          📍 {lat.toFixed(5)}, {lon.toFixed(5)}
        </p>
        <textarea
          placeholder="Comentari o descripció"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <br />
        <button type="submit">Enviar</button>
        <button type="button" onClick={onClose}>
          Cancel·la
        </button>
      </form>
    </div>
  );
};

// export const MapClickHandler = ({
//   onClick,
// }: {
//   onClick: (latlng: LatLng) => void;
// }) => {
//   useMapEvents({
//     click(e) {
//       onClick(e.latlng);
//     },
//   });
//   return null;
// };

export const MapClickHandler = ({
  onClick,
}: {
  onClick: (latlng: L.LatLng) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    // Clic dret (contextmenu)
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng);
    };

    // Pulsació llarga
    let touchTimeout: NodeJS.Timeout;
    let touchStartLatLng: LatLng | null = null;

    const handleTouchStart = (e: any) => {
      const touch = e.touches?.[0];
      if (!touch) return;

      const containerPoint = map.mouseEventToContainerPoint(touch);
      const latlng = map.containerPointToLatLng(containerPoint);
      touchStartLatLng = latlng;

      touchTimeout = setTimeout(() => {
        if (touchStartLatLng) onClick(touchStartLatLng);
      }, 700); // 700ms → considera-ho una pulsació llarga
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
    };

    map.on('contextmenu', handleContextMenu);
    map.getContainer().addEventListener('touchstart', handleTouchStart);
    map.getContainer().addEventListener('touchend', handleTouchEnd);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.getContainer().removeEventListener('touchstart', handleTouchStart);
      map.getContainer().removeEventListener('touchend', handleTouchEnd);
    };
  }, [map, onClick]);

  return null;
};
