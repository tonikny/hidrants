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
            {dades.comentari && <p className="m-[4px_0_0_0] italic font-inherit">"{dades.comentari}"</p>}
          </div>
        );
      case 'CANVI_ESTAT':
        return (
          <div className="font-inherit">
            Estat: <s>{dades.anterior}</s> ➡️ <strong>{dades.nou}</strong>
          </div>
        );
      case 'OBSERVACIO':
        return (
          <div className="font-inherit">
            <strong>Observació:</strong>
            <p className="m-[4px_0_0_0] font-inherit">{dades.comentari}</p>
          </div>
        );
      case 'CANVI_UBICACIO':
        return <div className="font-inherit">Ubicació actualitzada</div>;
      case 'CANVI_TIPUS':
        return (
          <div className="font-inherit">
            Tipus: <s>{dades.anterior}</s> ➡️ <strong>{dades.nou}</strong>
          </div>
        );
      default:
        return <div className="font-inherit">{tipus_event}</div>;
    }
  };

  return (
    <div className="flex flex-col gap-4 pl-[10px] border-l-2 border-[#ddd] relative">
      {sortedEvents.map((event) => (
        <div key={event.id} className="text-[0.8rem] relative">
          <div className="absolute -left-4 top-[4px] w-[10px] h-[10px] rounded-full bg-primary border-2 border-white" />
          <div className="text-[#888] text-[0.7rem] mb-[2px]">
            {formatData(event.creat_at)} - {event.nom_usuari || 'Anònim'}
          </div>
          <div className="bg-[#f8f9fa] p-[6px_10px] rounded-[6px] border border-soft font-inherit">
            {renderEventContent(event)}
          </div>
        </div>
      ))}
    </div>
  );
};
