import React from 'react';
import { IncidentEvent } from '../../types';

interface TimelineProps {
  events: IncidentEvent[];
}

export const Timeline = ({ events }: TimelineProps) => {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.creat_at).getTime() - new Date(a.creat_at).getTime()
  );

  const formatData = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ca-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderEventContent = (event: IncidentEvent) => {
    const { tipus_event, dades } = event;

    switch (tipus_event) {
      case 'CREACIO':
        return (
          <div>
            <strong>Creat l'incident</strong>
            {dades.comentari && <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>"{dades.comentari}"</p>}
          </div>
        );
      case 'CANVI_ESTAT':
        return (
          <div>
            Estat: <s>{dades.anterior}</s> ➡️ <strong>{dades.nou}</strong>
          </div>
        );
      case 'OBSERVACIO':
        return (
          <div>
            <strong>Observació:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{dades.comentari}</p>
          </div>
        );
      case 'CANVI_UBICACIO':
        return <div>Ubicació actualitzada</div>;
      case 'CANVI_TIPUS':
        return (
          <div>
            Tipus: <s>{dades.anterior}</s> ➡️ <strong>{dades.nou}</strong>
          </div>
        );
      default:
        return <div>{tipus_event}</div>;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem', 
      paddingLeft: '10px', 
      borderLeft: '2px solid #ddd',
      position: 'relative'
    }}>
      {sortedEvents.map((event) => (
        <div key={event.id} style={{ fontSize: '0.8rem', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            left: '-16px', 
            top: '4px', 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: '#007bff',
            border: '2px solid white'
          }} />
          <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '2px' }}>
            {formatData(event.creat_at)} - {event.nom_usuari || 'Anònim'}
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '6px 10px', 
            borderRadius: '6px',
            border: '1px solid #eee'
          }}>
            {renderEventContent(event)}
          </div>
        </div>
      ))}
    </div>
  );
};
