import type { IncidenciaFeature } from '../../types';

function centerIncidencia(feature: IncidenciaFeature) {
  window.dispatchEvent(new CustomEvent('map-center-node', { detail: feature }));
}

export function IncidenciaList({ features }: { features: IncidenciaFeature[] }) {
  if (features.length === 0) {
    return <p className="text-muted text-[0.85rem]">No hi ha incidències obertes.</p>;
  }

  return (
    <div className="max-h-[35vh] overflow-y-auto border border-soft rounded">
      {features.map((f) => {
        const p = f.properties;
        return (
          <div
            key={f.id}
            onClick={() => centerIncidencia(f)}
            className="flex items-center gap-3 px-3 py-[10px] border-b border-soft cursor-pointer transition-colors duration-100 hover:bg-[#f5f5f5]"
          >
            <span className="text-[1.1rem]">
              {p.tipus?.toUpperCase() === 'FOC' ? '🔥' : p.tipus?.toUpperCase() === 'FUM' ? '💨' : p.tipus?.toUpperCase() === 'ACCIDENT' ? '🚗' : '⚠️'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[0.95rem] whitespace-nowrap overflow-hidden text-ellipsis text-ink">
                {p.titol}
              </div>
              <div className="text-[0.75rem] text-muted flex flex-wrap gap-[4px] mt-[2px]">
                <span
                  className={`font-medium ${
                    p.estat === 'OBERT' ? 'text-[#d32f2f]' : p.estat === 'RESOLT' || p.estat === 'TANCAT' ? 'text-[#2e7d32]' : 'text-[#ed6c02]'
                  }`}
                >
                  {p.estat}
                </span>
                <span>•</span>
                <span>{p.prioritat}</span>
                <span>•</span>
                <span>{new Date(p.actualitzat_at).toLocaleString('ca-ES')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}