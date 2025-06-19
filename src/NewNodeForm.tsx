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

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  fontSize: '0.9rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: '#f9f9f9',
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
};

export const NewNodeForm = ({
  lat,
  lon,
  onClose,
  setNewNodeLatLng,
}: NodeFormProps) => {
  const [type, setType] = useState('');
  const [position, setPosition] = useState('');
  const [diameter, setDiameter] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [urbanizatio, setUrbanizatio] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = {
      'fire_hydrant:type': type,
      'fire_hydrant:position': position,
      'fire_hydrant:diameter': diameter,
      'addr:street': street,
      'addr:housenumber': num,
      'addr:neighbourhood': urbanizatio,
    };

    try {
      await sendToTelegram({
        lat,
        lon,
        tags,
        message,
      });
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
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1rem',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 2000,
        width: '92vw',
        maxWidth: '320px',
        fontFamily: 'sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center' }}>
          📍 Nova proposta de node
        </h2>
        <div style={{ fontSize: '0.9rem', color: '#555' }}>
          Coordenades:{' '}
          <strong>
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </strong>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Tipus:
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="columna">Columna</option>
            <option value="subterrani">Subterrani</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Posició:
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="calçada">Calçada</option>
            <option value="vorera">Vorera</option>
            <option value="verd">Verd</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Diàmetre:
          <select
            value={diameter}
            onChange={(e) => setDiameter(e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="100">100</option>
            <option value="70">70</option>
            <option value="45">45</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Carrer:
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Número:
          <input
            type="text"
            min={0}
            value={num}
            onChange={(e) => setNum(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Urbanització:
          <select
            value={urbanizatio}
            onChange={(e) => setUrbanizatio(e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="urb1">Urb1</option>
            <option value="urb2">Urb2</option>
            <option value="urb3">Urb3</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Comentari:
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="submit" style={primaryButtonStyle}>
            Enviar
          </button>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancel·la
          </button>
        </div>
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
