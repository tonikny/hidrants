import { useEffect, useState } from 'react';
import { useIncidencies } from '../../hooks/useIncidencies';
import type { Incidencia, IncidenciaEvent } from '../../types';
import { Timeline } from './Timeline';
import { IncidenciaHeader } from './IncidenciaHeader';
import { IncidenciaActions } from './IncidenciaActions';
import { IncidenciaEventForm } from './IncidenciaEventForm';

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
  hasLocation,
}: IncidenciaPopupProps) => {
  const { getIncidencia } = useIncidencies();
  const [incidencia, setIncidencia] = useState<Incidencia & { events: IncidenciaEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const loadIncidencia = async () => {
    try {
      setLoading(true);
      const data = await getIncidencia(incidenciaId);
      setIncidencia(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidencia();
  }, [incidenciaId]);

  if (loading) return <div className="min-w-[280px] p-4">Carregant incidència...</div>;
  if (!incidencia) return <div className="min-w-[280px] p-4">No s'ha trobat la incidència</div>;

  return (
    <div className="min-w-[280px] p-[0.2rem]">
      <IncidenciaHeader incidencia={incidencia} />

      <div className="max-h-[250px] overflow-y-auto mb-4">
        <Timeline events={incidencia.events} />
      </div>

      {!showAddEvent ? (
        <IncidenciaActions
          incidencia={incidencia}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          hasLocation={hasLocation}
          onEdit={() => setShowAddEvent(true)}
        />
      ) : (
        <IncidenciaEventForm
          incidencia={incidencia}
          onCancel={() => setShowAddEvent(false)}
          onDone={() => {
            setShowAddEvent(false);
            loadIncidencia();
            refreshIncidencies();
          }}
        />
      )}
    </div>
  );
}