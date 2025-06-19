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
//   isActive,
// }: {
//   onClick: (latlng: L.LatLng) => void;
//   onCancel: () => void;
//   isActive: boolean;
// }) => {
//   const map = useMap();
//   const hasOpenedRef = useRef(false);

//   useEffect(() => {
//     const handleContextMenu = (e: L.LeafletMouseEvent) => {
//       if (isActive) return;
//       if (hasOpenedRef.current) return; // evita duplicat
//       hasOpenedRef.current = true;
//       onClick(e.latlng);
//     };

//     const handleClick = () => {
//       if (isActive) return;
//       onCancel(); // tanca formulari si clic normal
//     };

//     let touchTimeout: NodeJS.Timeout;
//     let touchStartLatLng: LatLng | null = null;

//     const handleTouchStart = (e: TouchEvent) => {
//       if (isActive) return;
//       if (e.touches.length > 1) return; // ignora gestos amb més d’un dit
//       const touch = e.touches[0];
//       const pointer = point(touch.clientX, touch.clientY);
//       const latlng = map.containerPointToLatLng(pointer);

//       touchTimeout = setTimeout(() => {
//         if (hasOpenedRef.current) return;
//         hasOpenedRef.current = true;
//         onClick(latlng);
//       }, 800);
//     };

//     const handleTouchMove = (e: TouchEvent) => {
//       if (e.touches.length > 1) {
//         clearTimeout(touchTimeout); // cancel·la si es fa gest multi-touch (zoom)
//       }
//     };

//     const handleTouchEnd = () => {
//       clearTimeout(touchTimeout);
//       if (!hasOpenedRef.current) {
//         onCancel();
//       }
//       hasOpenedRef.current = false;
//     };

//     const container = map.getContainer();
//     map.on('contextmenu', handleContextMenu);
//     map.on('click', handleClick);
//     container.addEventListener('touchstart', handleTouchStart);
//     container.addEventListener('touchmove', handleTouchMove);
//     container.addEventListener('touchend', handleTouchEnd);

//     return () => {
//       map.off('contextmenu', handleContextMenu);
//       map.off('click', handleClick);
//       container.removeEventListener('touchstart', handleTouchStart);
//       container.removeEventListener('touchmove', handleTouchMove);
//       container.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [map, onClick, onCancel, isActive]);

//   return null;
// };

export const MapClickHandler = ({
  onClick,
  onCancel,
  isActive,
}: {
  onClick: (latlng: L.LatLng) => void;
  onCancel: () => void;
  isActive: boolean;
}) => {
  const map = useMap();
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      if (isActive) return;
      if (hasOpenedRef.current) return;
      hasOpenedRef.current = true;
      onClick(e.latlng);
    };

    const handleClick = () => {
      if (isActive) return; // Protegeix tancament mentre el form està obert
      onCancel();
    };

    let touchTimeout: NodeJS.Timeout;
    let touchStartLatLng: L.LatLng | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (isActive) return;
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      const pointer = point(touch.clientX, touch.clientY);
      const latlng = map.containerPointToLatLng(pointer);

      touchTimeout = setTimeout(() => {
        if (hasOpenedRef.current) return;
        hasOpenedRef.current = true;
        onClick(latlng);
      }, 800);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        clearTimeout(touchTimeout);
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      if (!hasOpenedRef.current && !isActive) {
        // Protegeix tancament si actiu
        onCancel();
      }
      hasOpenedRef.current = false;
    };

    const handleMoveStart = () => {
      // Quan comença a moure el mapa, no tanquem el form
      // Aquí no fem res, però el filtre està a handleClick i handleTouchEnd
    };

    const handleZoomStart = () => {
      // Quan comença zoom, no tanquem el form
    };

    const container = map.getContainer();
    map.on('contextmenu', handleContextMenu);
    map.on('click', handleClick);
    map.on('movestart', handleMoveStart);
    map.on('zoomstart', handleZoomStart);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleClick);
      map.off('movestart', handleMoveStart);
      map.off('zoomstart', handleZoomStart);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [map, onClick, onCancel, isActive]);

  return null;
};
