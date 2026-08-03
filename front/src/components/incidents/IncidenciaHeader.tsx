import type { Incidencia } from '../../types';

function emojiPrioritat(prioritat: Incidencia['prioritat']) {
  return prioritat === 'ALTA' ? '🔴' : prioritat === 'MITJANA' ? '🟠' : '🟡';
}

export function IncidenciaHeader({ incidencia }: { incidencia: Incidencia }) {
  return (
    <div className="mb-4 border-b border-soft pb-2">
      <h3 className="m-0 mb-2 flex items-center gap-2 text-[1.1rem]">
        <span>{emojiPrioritat(incidencia.prioritat)}</span>
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
  );
}