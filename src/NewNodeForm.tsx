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

  const inputStyle: React.CSSProperties = {
    padding: '4px 0 4px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.85rem',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundColor: 'white',
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: '12px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  const popupContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '0',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    width: 'min(60vw, 300px)',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1000,
    fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
  };

  return (
    <div style={popupContainerStyle}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          //   gap: '0.75rem',
          padding: '0.5rem 1rem',
          //   minWidth: '340px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          📍 Nova proposta de node
        </h2>

        <div
          style={{
            fontSize: '0.8rem',
            color: '#555',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          Coordenades:{' '}
          <strong>
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </strong>
        </div>

        {/* Línia 1: Tipus - Posició - Diàmetre */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Tipus:
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={selectStyle}
            />
          </label>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Posició:
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={selectStyle}
            />
          </label>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Diàmetre:
            <select
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              style={selectStyle}
            />
          </label>
        </div>

        {/* Línia 2: Carrer (100%) */}
        <label style={{ fontSize: '0.8rem', width: '100%' }}>
          Carrer:
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </label>

        {/* Línia 3: Número (1/3) i Urbanització (2/3) */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Número:
            <input
              type="text"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ flex: 2, fontSize: '0.8rem' }}>
            Urbanització:
            <select
              value={urbanizatio}
              onChange={(e) => setUrbanizatio(e.target.value)}
              style={selectStyle}
            />
          </label>
        </div>

        {/* Línia 4: Comentari (100%) */}
        <label style={{ fontSize: '0.8rem', width: '100%' }}>
          Comentari:
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
          />
        </label>

        {/* Botons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginTop: '0.2rem',
          }}
        >
          <button type="submit" style={{ ...primaryButtonStyle, flex: 1 }}>
            Enviar
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...secondaryButtonStyle, flex: 1 }}
          >
            Cancel·la
          </button>
        </div>
      </form>
    </div>
  );
};

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
    if (!isActive) {
      hasOpenedRef.current = false;
    }
  }, [isActive]);

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
