import React, { useEffect, useState } from 'react';
import { useIncidencies } from '../../hooks/useIncidencies';
import { Incident, IncidentEvent } from '../../types';
import { Timeline } from './Timeline';
import { 
  primaryButtonStyle, 
  secondaryButtonStyle, 
  inputStyle,
  selectStyle
} from '../../styles/uiStyles';
import { toast } from 'react-toastify';

interface IncidentPopupProps {
  incidentId: string;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  refreshIncidencies: () => void;
  hasLocation?: boolean;
}

export const IncidentPopup = ({ 
  incidentId, 
  showRoute, 
  setShowRoute, 
  refreshIncidencies,
  hasLocation 
}: IncidentPopupProps) => {
  const { getIncident, addEvent } = useIncidencies();
  const [incident, setIncident] = useState<Incident & { events: IncidentEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadIncident = async () => {
    try {
      setLoading(true);
      const data = await getIncident(incidentId);
      setIncident(data);
      setNewStatus(data.estat);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment && newStatus === incident?.estat) return;

    setIsSubmitting(true);
    try {
      if (newStatus !== incident?.estat) {
        await addEvent(incidentId, 'CANVI_ESTAT', {
          anterior: incident?.estat,
          nou: newStatus
        });
      }
      
      if (newComment) {
        await addEvent(incidentId, 'OBSERVACIO', {
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

  if (loading) return <div>Carregant incidència...</div>;
  if (!incident) return <div>No s'ha trobat la incidència</div>;

  const emojiPrioritat = incident.prioritat === 'ALTA' ? '🔴' : incident.prioritat === 'MITJANA' ? '🟠' : '🟡';

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{emojiPrioritat}</span>
          {incident.titol}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            padding: '2px 6px', 
            backgroundColor: '#eee', 
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            {incident.tipus}
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            padding: '2px 6px', 
            backgroundColor: '#007bff', 
            color: 'white',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            {incident.estat}
          </span>
        </div>
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
        <Timeline events={incident.events} />
      </div>

      {!showAddEvent ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowAddEvent(true)}
            style={{ ...primaryButtonStyle, flex: 2, padding: '8px', fontSize: '0.8rem' }}
          >
            Actualitzar / Comentar
          </button>
          <button
            onClick={() => setShowRoute(!showRoute)}
            disabled={!hasLocation}
            style={{ 
              ...secondaryButtonStyle, 
              flex: 1, 
              padding: '8px', 
              fontSize: '0.8rem',
              opacity: !hasLocation ? 0.5 : 1
            }}
          >
            {showRoute ? 'Treure Ruta' : 'Com anar-hi'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleAddEvent}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Nou estat:</label>
            <select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ ...selectStyle, marginBottom: '0.5rem' }}
            >
              <option value="OBERT">OBERT</option>
              <option value="EN_PROGRES">EN PROGRÉS</option>
              <option value="RESOLT">RESOLT</option>
              <option value="TANCAT">TANCAT</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Comentari:</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Afegeix una observació..."
              style={{ ...inputStyle, height: '60px', resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ ...primaryButtonStyle, flex: 1, padding: '8px' }}
            >
              {isSubmitting ? 'Enviant...' : 'Guardar'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowAddEvent(false)}
              style={{ ...secondaryButtonStyle, flex: 1, padding: '8px' }}
            >
              Cancel·lar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
