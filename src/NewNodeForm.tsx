import { useEffect, useRef, useState } from 'react';
import { sendToTelegram } from './sendToTelegram';
import { useMap } from 'react-leaflet';
import { LatLng, point } from 'leaflet';
import { toast } from 'react-toastify';

type NodeFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
  setNewNodeLatLng: (latlng: LatLng | null) => void;
};

export const NewNodeForm = ({
  lat,
  lon,
  onClose,
  setNewNodeLatLng,
}: NodeFormProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendToTelegram({ lat, lon, message });
      toast.success('Missatge enviat!');
      setMessage('');
      onClose();
      setNewNodeLatLng(null);
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

// export const MapClickHandler = ({
//   onClick,
//   onCancel,
// }: {
//   onClick: (latlng: L.LatLng) => void;
//   onCancel: () => void;
// }) => {
//   const map = useMap();
//   const hasOpenedRef = useRef(false);

//   useEffect(() => {
//     // Clic dret
//     const handleContextMenu = (e: L.LeafletMouseEvent) => {
//       onClick(e.latlng);
//     };

//     // Clic esquerre
//     const handleClick = () => {
//       onCancel(); // tanca formulari
//     };

//     let touchTimeout: NodeJS.Timeout;
//     let touchStartLatLng: LatLng | null = null;
//     let hasFired = false;

//     const handleTouchStart = (e: TouchEvent) => {
//       const touch = e.touches?.[0];
//       if (!touch) return;

//       const pointer = point(touch.clientX, touch.clientY);
//       const latlng = map.containerPointToLatLng(pointer);
//       touchStartLatLng = latlng;

//       touchTimeout = setTimeout(() => {
//         hasOpenedRef.current = true;
//         onClick(touchStartLatLng!);
//       }, 800);
//     };

//     const handleTouchEnd = () => {
//       clearTimeout(touchTimeout);
//       if (!hasOpenedRef.current) {
//         onCancel();
//       }
//       // Reiniciar el flag per propera interacció
//       hasOpenedRef.current = false;
//     };

//     map.on('contextmenu', handleContextMenu);
//     map.on('click', handleClick);
//     map.getContainer().addEventListener('touchstart', handleTouchStart);
//     map.getContainer().addEventListener('touchend', handleTouchEnd);

//     return () => {
//       map.off('contextmenu', handleContextMenu);
//       map.off('click', handleClick);
//       map.getContainer().removeEventListener('touchstart', handleTouchStart);
//       map.getContainer().removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [map, onClick, onCancel]);

//   return null;
// };
export const MapClickHandler = ({
  onClick,
  onCancel,
}: {
  onClick: (latlng: L.LatLng) => void;
  onCancel: () => void;
}) => {
  const map = useMap();
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      if (hasOpenedRef.current) return; // evita duplicat
      hasOpenedRef.current = true;
      onClick(e.latlng);
    };

    const handleClick = () => {
      onCancel(); // tanca formulari si clic normal
    };

    let touchTimeout: NodeJS.Timeout;
    let touchStartLatLng: LatLng | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // ignora gestos amb més d’un dit

      const touch = e.touches[0];
      const pointer = point(touch.clientX, touch.clientY);
      const latlng = map.containerPointToLatLng(pointer);
      touchStartLatLng = latlng;

      touchTimeout = setTimeout(() => {
        if (hasOpenedRef.current) return;
        hasOpenedRef.current = true;
        onClick(latlng);
      }, 800);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        clearTimeout(touchTimeout); // ⛔ cancel·la si es fa gest multi-touch (zoom)
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      if (!hasOpenedRef.current) {
        onCancel();
      }
      hasOpenedRef.current = false;
    };

    const container = map.getContainer();
    map.on('contextmenu', handleContextMenu);
    map.on('click', handleClick);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleClick);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [map, onClick, onCancel]);

  return null;
};
