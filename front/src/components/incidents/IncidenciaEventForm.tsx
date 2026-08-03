import { useState } from 'react';
import type { Incidencia } from '../../types';
import { useIncidencies } from '../../hooks/useIncidencies';
import { toast } from 'react-toastify';
import { inputClass, primaryButtonClass, secondaryButtonClass, selectClass } from '../../styles/uiStyles';

export function IncidenciaEventForm({
  incidencia,
  onCancel,
  onDone,
}: {
  incidencia: Incidencia;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { addEvent } = useIncidencies();
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState<string>(incidencia.estat);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newComment && newStatus === incidencia.estat) return;

    setIsSubmitting(true);
    try {
      if (newStatus !== incidencia.estat) {
        await addEvent(incidencia.id, 'CANVI_ESTAT', {
          anterior: incidencia.estat,
          nou: newStatus,
        });
      }
      if (newComment) {
        await addEvent(incidencia.id, 'OBSERVACIO', {
          comentari: newComment,
        });
      }
      toast.success('Activitat registrada');
      onDone();
    } catch (err) {
      toast.error('Error al registrar l\'activitat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            onCancel();
          }}
          className={`${secondaryButtonClass} flex-1 p-2`}
        >
          Cancel·lar
        </button>
      </div>
    </form>
  );
}