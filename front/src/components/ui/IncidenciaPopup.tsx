import React, { useEffect, useState } from 'react';
import { useIncidencies } from '../../hooks/useIncidencies';
import { Incidencia, IncidenciaEvent } from '../../types';
import { Timeline } from './Timeline';
import { 
  primaryButtonClass, 
  secondaryButtonClass, 
  inputClass,
  selectClass
} from '../../styles/uiStyles';
import { toast } from 'react-toastify';
import { openInNativeMaps } from '../../utils/geoMaps';

interface IncidenciaPopupProps {
  incidenciaId: string;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export const IncidenciaPopup = ({ 
  incidenciaId, 
  showRoute, 
  setShowRoute, 
  refreshIncidencies,
  hasLocation 
}: IncidenciaPopupProps) => {
  const { getIncidencia, addEvent } = useIncidencies();
  const [incidencia, setIncidencia] = useState<Incidencia & { events: IncidenciaEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await getIncidencia(incidenciaId);
      setIncidencia(data);
      setNewStatus(data.estat);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidenciaId]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newComment && newStatus === incidencia?.estat) return;

    setIsSubmitting(true);
    try {
      if (newStatus !== incidencia?.estat) {
        await addEvent(incidenciaId, 'CANVI_ESTAT', {
          anterior: incidencia?.estat,
          nou: newStatus
        });
      }
      
      if (newComment) {
        await addEvent(incidenciaId, 'OBSERVACIO', {
          comentari: newComment
        });
      }

      toast.success('Activitat registrada');
      setNewComment('');
      setShowAddEvent(false);
      loadIncident();
      refreshIncidencies(); // Actualitzar mapa
    } catch (err) {
      toast.error('Error al registrar l\'activitat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    if (incidencia) {
      openInNativeMaps(incidencia.lat, incidencia.lon, incidencia.titol);
    }
  };

  if (loading) return <div className="min-w-[280px] p-4">Carregant incidència...</div>;
  if (!incidencia) return <div className="min-w-[280px] p-4">No s'ha trobat la incidència</div>;

  const emojiPrioritat = incidencia.prioritat === 'ALTA' ? '🔴' : incidencia.prioritat === 'MITJANA' ? '🟠' : '🟡';

  return (
    <div className="min-w-[280px] p-[0.2rem]">
      <div className="mb-4 border-b border-soft pb-2">
        <h3 className="m-0 mb-2 flex items-center gap-2 text-[1.1rem]">
          <span>{emojiPrioritat}</span>
          {incidencia.titol}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <span className="text-[0.7rem] px-[6px] py-[2px] bg-soft rounded uppercase font-bold">
            {incidencia.tipus}
          </span>
          <span className="text-[0.7rem] px-[6px] py-[2px] bg-primary text-white rounded uppercase font-bold">
            {incidencia.estat}
          </span>
        </div>
      </div>

      <div className="max-h-[250px] overflow-y-auto mb-4">
        <Timeline events={incidencia.events} />
      </div>

      {!showAddEvent ? (
        <div className="flex justify-center items-center gap-[30px] mt-[10px] py-[5px]">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddEvent(true);
            }}
            title="Actualitzar / Comentar"
            className="bg-transparent border-0 cursor-pointer text-[1.5rem] p-0"
          >
            ✏️
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!showRoute && !hasLocation) {
                toast.info('Cal activar el seguiment GPS per veure la ruta');
                return;
              }
              setShowRoute(!showRoute);
            }}
            title={showRoute ? 'Treure Ruta' : 'Com anar-hi'}
            className={`bg-transparent border-0 cursor-pointer text-[1.5rem] p-0 ${(showRoute || hasLocation) ? '' : 'grayscale opacity-50'}`}
          >
            🛣️
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenMaps();
            }}
            title="Obrir en navegador GPS"
            className="bg-transparent border-0 cursor-pointer text-[1.5rem] p-0"
          >
            🚕
          </button>
        </div>
      ) : (
        <form onSubmit={handleAddEvent} onClick={(e) => e.stopPropagation()}>
          <div className="mb-3">
            <label className="text-[0.8rem] font-bold block mb-[4px]">Nou estat:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={`${selectClass} mb-2 p-[6px]!`}
            >
              <option value="OBERT">OBERT</option>
              <option value="EN_PROGRES">EN PROGRÉS</option>
              <option value="RESOLT">RESOLT</option>
              <option value="TANCAT">TANCAT</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="text-[0.8rem] font-bold block mb-[4px]">Comentari:</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Afegeix una observació..."
              className={`${inputClass} h-20 resize-none p-2! font-inherit`}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${primaryButtonClass} flex-1 p-2`}
            >
              {isSubmitting ? 'Enviant...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddEvent(false);
              }}
              className={`${secondaryButtonClass} flex-1 p-2`}
            >
              Cancel·lar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
