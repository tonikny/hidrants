import { useEffect, useRef, useState } from 'react';
import { sendToTelegram } from '../sendToTelegram';
import { useMap } from 'react-leaflet';
import { LatLng, point } from 'leaflet';
import { toast } from 'react-toastify';
import {
  inputStyle,
  popupContainerStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  selectStyle,
} from '../styles/uiStyles';

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
      toast.success('Dades enviades!');
      setMessage('');
      onClose();
      setNewNodeLatLng(null);
    } catch (err) {
      console.log(err);
      toast.error('Error enviant les dades');
    }
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
          📍 Nou hidrant
        </h2>

        <div
          style={{
            fontSize: '0.8rem',
            color: '#555',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <strong>
            [ {lat.toFixed(5)}, {lon.toFixed(5)} ]
          </strong>
        </div>

        {/* Línia 1: Tipus - Posició - Diàmetre */}
        <div style={{ display: 'flex', gap: '0.5rem', fontStyle: 'italic' }}>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Tipus:{' '}
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
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Posició:{' '}
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
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Diàmetre:{' '}
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
        </div>

        {/* Línia 2: Carrer (100%) */}
        <label
          style={{ fontSize: '0.8rem', width: '100%', fontStyle: 'italic' }}
        >
          Carrer:{' '}
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </label>

        {/* Línia 3: Número (1/3) i Urbanització (2/3) */}
        <div style={{ display: 'flex', gap: '0.5rem', fontStyle: 'italic' }}>
          <label style={{ flex: 1, fontSize: '0.8rem' }}>
            Número:{' '}
            <input
              type="text"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ flex: 2, fontSize: '0.8rem' }}>
            Urbanització:{' '}
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
        </div>

        {/* Línia 4: Comentari (100%) */}
        <label
          style={{ fontSize: '0.8rem', width: '100%', fontStyle: 'italic' }}
        >
          Comentari:{' '}
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

    let touchTimeout: number;
    let touchStartPoint: L.Point | null = null;
    const TOUCH_MOVE_THRESHOLD = 10;

    const handleTouchStart = (e: TouchEvent) => {
      if (isActive) return;
      if (e.touches.length > 1) return;

      const touch = e.touches[0];
      const point = pointFromTouch(touch);
      const latlng = map.containerPointToLatLng(point);

      touchStartPoint = point;

      touchTimeout = setTimeout(() => {
        if (hasOpenedRef.current) return;
        hasOpenedRef.current = true;
        onClick(latlng);
      }, 800);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        clearTimeout(touchTimeout);
        return;
      }
      if (!touchStartPoint) return;

      const touch = e.touches[0];
      const currentPoint = pointFromTouch(touch);

      const dx = currentPoint.x - touchStartPoint.x;
      const dy = currentPoint.y - touchStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > TOUCH_MOVE_THRESHOLD) {
        clearTimeout(touchTimeout); // cancel·la si el dit es mou massa
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      if (!hasOpenedRef.current && !isActive) {
        onCancel();
      }
      hasOpenedRef.current = false;
    };

    // Helper per convertir touch a Leaflet point
    const pointFromTouch = (touch: Touch) => {
      return point(touch.clientX, touch.clientY);
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
