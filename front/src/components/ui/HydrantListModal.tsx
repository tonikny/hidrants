import { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Modal } from './Modal';
import { HidrantFeature } from '../../hooks/useHidrantData';
import { getHydrantStatus, getHydrantIconUrl } from '../../utils/icons';
import { inputClass } from '../../styles/uiStyles';

interface HydrantListModalProps {
  features: HidrantFeature[];
  className?: string;
}

export function HydrantListModal({ features, className }: HydrantListModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Evitem que el scroll del mapa es mogui quan estem sobre la llista
  useEffect(() => {
    if (open && containerRef.current) {
      const el = containerRef.current;
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, [open]);

  const filteredFeatures = useMemo(() => {
    if (!search) return features;
    const s = search.toLowerCase();
    return features.filter((f) => {
      const ui = f.properties.ui_fields || {};
      const address = `${ui.street || ''} ${ui.num || ''} ${
        ui.barri || ''
      }`.toLowerCase();
      return address.includes(s);
    });
  }, [features, search]);

  const handleCenter = (nodeId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('node', nodeId);
    window.history.replaceState({}, '', url.toString());

    // Dispatchem NOMÉS el check de la URL. El MapUrlHandler ja s'encarrega d'esperar al flyTo
    // per disparar 'map-node-centered' i obrir el popup.
    window.dispatchEvent(new CustomEvent('map-force-url-check'));

    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${className || ''} text-[1.2rem]`}
        title="Llista d'hidrants"
      >
        📃
      </button>

      {open && (
        <Modal
          title="Llista d'hidrants"
          onClose={() => setOpen(false)}
          containerStyle={{
            width: 'min(95vw, 500px)',
            maxWidth: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            ref={containerRef}
            className="p-[0.5rem_0] flex flex-col h-[75vh] box-border"
          >
            <div className="px-[2px]">
              <input
                type="text"
                placeholder="Cerca per carrer/barri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} mb-4 p-2! box-border`}
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-soft rounded">
              {filteredFeatures.length === 0 ? (
                <p className="text-center text-muted p-5">
                  No s'han trobat hidrants.
                </p>
              ) : (
                filteredFeatures.map((f) => {
                  const ui = f.properties.ui_fields || {};
                  const address = `${ui.street || ''} ${ui.num || ''}`.trim();
                  const neighborhood = ui.barri ? `(${ui.barri})` : '';
                  const diameters = ui.diameters
                    ? ui.diameters.split(';').join(', ') + ' mm'
                    : '';
                  const isOutOfService = ui.estat === 'Fora de servei';

                  return (
                    <div
                      key={f.id}
                      onClick={() => handleCenter(f.id)}
                      onMouseEnter={() => setHoveredId(f.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`flex items-center gap-3 px-3 py-[10px] border-b border-soft cursor-pointer transition-colors duration-100 ${hoveredId === f.id ? 'bg-[#f5f5f5]' : 'bg-transparent'}`}
                    >
                      <img
                        src={getHydrantIconUrl(getHydrantStatus(ui))}
                        alt="Estat"
                        className="w-4 h-[26px] object-contain shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold text-[0.95rem] whitespace-nowrap overflow-hidden text-ellipsis text-ink"
                          title={`${address} ${neighborhood}`}
                        >
                          {address || 'Sense adreça'}{' '}
                          <span className="font-normal text-muted text-[0.85rem]">
                            {neighborhood}
                          </span>
                        </div>

                        <div className="text-[0.75rem] text-muted flex flex-wrap gap-[4px] mt-[2px]">
                          <span className={`font-medium ${isOutOfService ? 'text-[#d32f2f]' : 'text-[#2e7d32]'}`}>
                            {ui.estat || 'Desconegut'}
                          </span>
                          <span>•</span>
                          <span>{ui.surveyDate || 'No revisat'}</span>
                          {diameters && (
                            <>
                              <span>•</span>
                              <span>{diameters}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-[10px] text-[0.8rem] text-[#888] text-right px-[4px]">
              Total: {filteredFeatures.length} hidrants
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
