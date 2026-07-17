import { useEffect, useRef, useState } from 'react';
import { sendToTelegram } from '../../utils/sendToTelegram';
import { useMap } from 'react-leaflet';
import { LatLng, point } from 'leaflet';
import { toast } from 'react-toastify';
import {
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../../styles/uiStyles';
import { HydrantUiFields } from '../../utils/osmConversion';
import { HydrantFormFields } from './HydrantFormFields';
import { useAdf } from '../../contexts/AdfContext';

type NodeFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
  setNewNodeLatLng: (latlng: LatLng | null) => void;
  refreshHidrants?: () => Promise<void>;
};

export const NewNodeForm = ({
  lat,
  lon,
  onClose,
  setNewNodeLatLng,
  refreshHidrants,
}: NodeFormProps) => {
  const [observacions, setObservacions] = useState('');
  const { activeAdf } = useAdf();
  const [isInspected, setIsInspected] = useState(false);

  const [data, setData] = useState<HydrantUiFields>({
    type: '',
    position: '',
    couplings: '',
    diameters: '',
    pressure: '',
    street: '',
    num: '',
    barri: '',
    estat: 'Desconegut',
    surveyDate: '',
  });

  const handleInspectedChange = (checked: boolean) => {
    setIsInspected(checked);
    if (checked) {
      setData((prev) => ({
        ...prev,
        estat: 'Operatiu',
        surveyDate: new Date().toISOString().split('T')[0],
      }));
    } else {
      setData((prev) => ({
        ...prev,
        estat: 'Desconegut',
        surveyDate: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendToTelegram({
        lat,
        lon,
        tags: { 
          ui_fields: data,
          private_tags: {
            observacions: observacions.trim() || undefined,
          },
        },
        message: 'Node creat',
        adf_id: activeAdf?.id,
      });
      toast.success('Hidrant afegit');
      setObservacions('');
      if (refreshHidrants) {
        await refreshHidrants();
      }
      onClose();
      setNewNodeLatLng(null);
    } catch (err) {
      toast.error("Error en afegir l'hidrant");
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

      <div style={{ marginBottom: '0.5rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: isInspected ? '#e8f5e9' : '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${isInspected ? '#2e7d32' : '#ccc'}`,
          }}
        >
          <input
            type="checkbox"
            checked={isInspected}
            onChange={(e) => handleInspectedChange(e.target.checked)}
          />
          <span>🔍 He revisat l'estat ara mateix</span>
        </label>
      </div>

      <HydrantFormFields
        data={data}
        onChange={setData}
        showSurveyDateAndStatus={isInspected}
      />

      {/* Observacions (100%) */}
      <label
        style={{
          fontSize: '0.8rem',
          width: '100%',
          fontStyle: 'italic',
          marginBottom: '1rem',
          marginTop: '0.5rem',
        }}
      >
        Observacions:
        <textarea
          value={observacions}
          onChange={(e) => setObservacions(e.target.value)}
          rows={2}
          placeholder="Observacions internes de l'hidrant..."
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
