import { useEffect, useState } from 'react';
import { sendToTelegram } from './sendToTelegram';
import { useMap } from 'react-leaflet';
import { LatLng, point } from 'leaflet';
import { toast } from 'react-toastify';

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
      toast.success('Missatge enviat!');
      setMessage('');
      onClose();
    } catch (err) {
      console.log(err);
      toast.error('Error enviant el missatge');
    }
  };
  return (
    <div
      className="form-popup"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
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

export const MapClickHandler = ({
  onClick,
  onCancel,
}: {
  onClick: (latlng: L.LatLng) => void;
  onCancel: () => void;
}) => {
  const map = useMap();

  useEffect(() => {
    // Clic dret
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng);
    };

    // Clic esquerre
    const handleClick = () => {
      onCancel(); // tanca formulari
    };

    let touchTimeout: NodeJS.Timeout;
    let touchStartLatLng: LatLng | null = null;
    let hasFired = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches?.[0];
      if (!touch) return;

      const pointer = point(touch.clientX, touch.clientY);
      const latlng = map.containerPointToLatLng(pointer);
      touchStartLatLng = latlng;
      hasFired = false;

      //   touchTimeout = setTimeout(() => {
      //     hasFired = true;
      //     if (touchStartLatLng) onClick(touchStartLatLng);
      //   }, 800); // pulsació llarga

      touchTimeout = setTimeout(() => {
        hasFired = true;
        requestAnimationFrame(() => {
          if (touchStartLatLng) onClick(touchStartLatLng);
        });
      }, 800);
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      if (!hasFired) {
        onCancel(); // només si no s’ha obert ja el form
      }
    };
    // Pulsació llarga
    // let touchTimeout: NodeJS.Timeout;
    // let touchStartLatLng: LatLng | null = null;
    // let cancelled = false;

    // const handleTouchStart = (e: TouchEvent) => {
    //   const touch = e.touches?.[0];
    //   if (!touch) return;

    //   const pointer = point(touch.clientX, touch.clientY);
    //   const latlng = map.containerPointToLatLng(pointer);
    //   touchStartLatLng = latlng;
    //   cancelled = false;

    //   touchTimeout = setTimeout(() => {
    //     cancelled = true;
    //     if (touchStartLatLng) onClick(touchStartLatLng);
    //   }, 800);
    // };
    // const handleTouchEnd = () => {
    //   clearTimeout(touchTimeout);
    //   if (!cancelled) {
    //     onCancel(); // pulsació curta → tanca
    //   }
    // };

    map.on('contextmenu', handleContextMenu);
    map.on('click', handleClick);
    map.getContainer().addEventListener('touchstart', handleTouchStart);
    map.getContainer().addEventListener('touchend', handleTouchEnd);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleClick);
      map.getContainer().removeEventListener('touchstart', handleTouchStart);
      map.getContainer().removeEventListener('touchend', handleTouchEnd);
    };
  }, [map, onClick, onCancel]);

  return null;
};
