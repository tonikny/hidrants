import { useEffect, useRef, useState } from 'react';
import { sendToTelegram } from '../../utils/sendToTelegram';
import { useMap } from 'react-leaflet';
import { LatLng, point } from 'leaflet';
import { toast } from 'react-toastify';
import {
  inputStyle,
  popupContainerStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  selectStyle,
} from '../../styles/uiStyles';
import { HydrantUiFields, ui2Osm } from '../../utils/osmConversion';

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

  const uiData: HydrantUiFields = {
    type: '',
    position: '',
    couplings: '',
    diameters: '',
    pressure: '',
    street: '',
    num: '',
    urbanitzacio: '',
    estat: '',
    surveyDate: '',
  };
  const [data, setData] = useState(uiData);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    const tags = ui2Osm(data);

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
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          color: '#555',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <strong>
          [ {lat.toFixed(5)}, {lon.toFixed(5)} ]
        </strong>
      </div>

      {/* Línia 1: Tipus - Posició */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          fontStyle: 'italic',
          marginBottom: '0.5rem',
        }}
      >
        <label style={{ flex: 1, fontSize: '0.8rem' }}>
          Tipus:
          <select
            value={data.type}
            onChange={(e) =>
              setData((prev) => ({ ...prev, type: e.target.value }))
            }
            style={selectStyle}
          >
            <option value=""></option>
            <option value="pillar">Columna</option>
            <option value="underground">Subterrani</option>
          </select>
        </label>
        <label style={{ flex: 1, fontSize: '0.8rem' }}>
          Posició:
          <select
            value={data.position}
            onChange={(e) =>
              setData((prev) => ({ ...prev, position: e.target.value }))
            }
            style={selectStyle}
          >
            <option value=""></option>
            <option value="lane">Calçada</option>
            <option value="sidewalk">Vorera</option>
            <option value="green">Verd</option>
          </select>
        </label>
      </div>

      {/* Línia 2: Acoblaments - Pressió */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          fontStyle: 'italic',
          marginBottom: '0.5rem',
        }}
      >
        <label style={{ flex: 1, fontSize: '0.8rem' }}>
          Acoblaments:
          <select
            value={data.couplings}
            onChange={(e) =>
              setData((prev) => ({ ...prev, couplings: e.target.value }))
            }
            style={selectStyle}
          >
            <option value=""></option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label style={{ flex: 1, fontSize: '0.8rem' }}>
          Pressió (bar):
          <input
            type="number"
            value={data.pressure}
            onChange={(e) =>
              setData((prev) => ({ ...prev, pressure: e.target.value }))
            }
            style={inputStyle}
          />
        </label>
      </div>

      {/* Línia 3: Diàmetres dinàmics */}
      {Number(data.couplings) > 0 && (
        <label style={{ fontSize: '0.75rem' }}>
          Diàmetres (mm):
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.3rem',
              marginTop: '0.2rem',
              marginBottom: '1rem',
            }}
          >
            {Array.from({ length: Number(data.couplings) }, (_, i) => (
              <select
                key={i}
                value={data.diameters.split(';')[i]}
                onChange={(e) => {
                  const nd = [...data.diameters];
                  nd[i] = e.target.value;
                  setData((prev) => ({
                    ...prev,
                    diameters: nd.join(';'),
                  }));
                  setData((prev) => ({
                    ...prev,
                    diameters: e.target.value,
                  }));
                }}
                style={{ ...selectStyle, flex: '1 1 30%' }}
              >
                <option value=""></option>
                <option value="45">45</option>
                <option value="70">70</option>
                <option value="100">100</option>
              </select>
            ))}
          </div>
        </label>
      )}

      {/* Línia 2: Carrer (100%) */}
      <label
        style={{
          fontSize: '0.8rem',
          width: '100%',
          fontStyle: 'italic',
          marginBottom: '1rem',
        }}
      >
        Carrer:
        <input
          type="text"
          value={data.street}
          onChange={(e) =>
            setData((prev) => ({ ...prev, street: e.target.value }))
          }
          style={{ ...inputStyle, width: '100%' }}
        />
      </label>

      {/* Línia 3: Número (1/3) i Urbanització (2/3) */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          fontStyle: 'italic',
          marginBottom: '1rem',
        }}
      >
        <label style={{ flex: 1, fontSize: '0.8rem' }}>
          Número:
          <input
            type="text"
            value={data.num}
            onChange={(e) =>
              setData((prev) => ({ ...prev, num: e.target.value }))
            }
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 2, fontSize: '0.8rem' }}>
          Urbanització:
          <select
            value={data.urbanitzacio}
            onChange={(e) =>
              setData((prev) => ({ ...prev, urbanitzacio: e.target.value }))
            }
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
        style={{
          fontSize: '0.8rem',
          width: '100%',
          fontStyle: 'italic',
          marginBottom: '1rem',
        }}
      >
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
          marginTop: '0.5rem',
        }}
      >
        <button
          type="submit"
          style={{
            ...primaryButtonStyle,
            flex: 1,
            padding: '6px',
            fontSize: '0.75rem',
          }}
        >
          Enviar
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            ...secondaryButtonStyle,
            flex: 1,
            padding: '6px',
            fontSize: '0.75rem',
          }}
        >
          Cancel·la
        </button>
      </div>
    </form>
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
      // e.originalEvent?.preventDefault?.();
      // e.originalEvent?.stopPropagation?.();
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
