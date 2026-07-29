import { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Modal } from './Modal';
import { HidrantFeature } from '../../hooks/useHidrantData';
import { getHydrantStatus, getHydrantIconUrl } from '../../utils/icons';
import { inputStyle } from '../../styles/uiStyles';

interface HydrantListModalProps {
  features: HidrantFeature[];
  style?: React.CSSProperties;
}

export function HydrantListModal({ features, style }: HydrantListModalProps) {
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
        style={{
          ...style,
          fontSize: '1.2rem',
        }}
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
            style={{
              padding: '0.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              height: '75vh',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ padding: '0 2px' }}>
              <input
                type="text"
                placeholder="Cerca per carrer/barri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  ...inputStyle,
                  marginBottom: '1rem',
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '4px',
              }}
            >
              {filteredFeatures.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#666',
                    padding: '20px',
                  }}
                >
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        backgroundColor:
                          hoveredId === f.id ? '#f5f5f5' : 'transparent',
                        transition: 'background-color 0.1s',
                      }}
                    >
                      <img
                        src={getHydrantIconUrl(getHydrantStatus(ui))}
                        alt="Estat"
                        style={{
                          width: '16px',
                          height: '26px',
                          objectFit: 'contain',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: '#333',
                          }}
                          title={`${address} ${neighborhood}`}
                        >
                          {address || 'Sense adreça'}{' '}
                          <span
                            style={{
                              fontWeight: 'normal',
                              color: '#666',
                              fontSize: '0.85rem',
                            }}
                          >
                            {neighborhood}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '500',
                              color: isOutOfService ? '#d32f2f' : '#2e7d32',
                            }}
                          >
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

            <div
              style={{
                marginTop: '10px',
                fontSize: '0.8rem',
                color: '#888',
                textAlign: 'right',
                padding: '0 4px',
              }}
            >
              Total: {filteredFeatures.length} hidrants
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
