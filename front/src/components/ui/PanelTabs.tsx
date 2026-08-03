import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdf } from '../../contexts/AdfContext';
import { Login } from './Login';
import { Modal } from './Modal';
import { SyncButton } from '../controls/SyncButton';
import type { PanelTab } from './Panel';
import type { HidrantFeature } from '../../hooks/useHidrantData';
import type { IncidentFeature } from '../../types';
import { getHydrantStatus, getHydrantIconUrl } from '../../utils/icons';
import {
  hidrant_op_rev,
  hidrant_op_nrev,
  hidrant_nop_rev,
  hidrant_nop_nrev,
  hidrant_no_info,
} from '../../utils/icons';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../styles/uiStyles';
import { toast } from 'react-toastify';

interface Position {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  battery: number;
  receivedAt: number;
}

const CONNECTED_MS = 15 * 60 * 1000;

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `fa ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `fa ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `fa ${h} h`;
  return `fa ${Math.floor(h / 24)} dies`;
}

function MapaTab() {
  const { adfs, isLoading, activeAdf, setActiveAdf } = useAdf();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="text-center p-8 text-muted text-[0.85rem]">Carregant ADFs...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="m-0 mb-1 text-[0.95rem] font-semibold">Escull àmbit territorial</h3>
      <div className="border border-border rounded overflow-hidden mt-2">
        {adfs.map((adf) => (
          <button
            key={adf.id}
            onClick={() => setActiveAdf(adf)}
            className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b border-soft last:border-b-0 cursor-pointer text-[0.9rem] transition-colors ${
              activeAdf?.id === adf.id
                ? 'bg-[#e3f2fd] text-ink font-semibold'
                : 'bg-white text-ink'
            }`}
          >
            <span className={activeAdf?.id === adf.id ? 'text-primary' : 'text-muted'}>-</span>
            <span>{adf.nom}</span>
          </button>
        ))}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-4">
          <h4 className="m-0 mb-2 text-[0.85rem] font-semibold">Sincronització amb OSM</h4>
          <SyncButton
            label="Sincronitzar amb OSM"
            className="w-full bg-white text-ink border border-border rounded cursor-pointer p-2 flex items-center justify-center gap-2 text-[0.9rem]"
          />
          <p className="text-muted text-[0.8rem] mt-2 mb-0">
            Descarrega les dades d'OSM cap a l'app. Els canvis locals pendents podrien sobreescriure's si són més antics que els d'OSM.
          </p>
        </div>
      )}
    </div>
  );
}

function TrackingTab({ positions }: { positions: Record<string, Position> }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(!!user?.mqtt_enabled);
  const [otrc, setOtrc] = useState<Record<string, unknown> | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/tracking/status', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          setAvailable(data.available);
          setEnabled(data.enabled);
        }
      } catch { /* ignore */ }
    };
    poll();
    const t = setInterval(poll, 300000);
    return () => clearInterval(t);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking/enable', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error activant OwnTracks');
        return;
      }
      setOtrc(await res.json());
      setEnabled(true);
      setShowModal(true);
    } catch {
      toast.error('Error de connexió');
    } finally {
      setLoading(false);
    }
  };

  const handleConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking/config', { credentials: 'same-origin' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error descarregant config');
        return;
      }
      setOtrc(await res.json());
      setShowModal(true);
    } catch {
      toast.error('Error de connexió');
    } finally {
      setLoading(false);
    }
  };

  const downloadCurrent = () => {
    if (!otrc || !user) return;
    const blob = new Blob([JSON.stringify(otrc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.username}.otrc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowModal(false);
  };

  const connected = useMemo(() => {
    const now = Date.now();
    return Object.entries(positions)
      .map(([username, pos]) => ({ username, ts: pos.receivedAt || pos.timestamp }))
      .filter((p) => now - p.ts < CONNECTED_MS)
      .sort((a, b) => b.ts - a.ts);
  }, [positions]);

  if (!user) {
    return (
      <div className="p-4 text-[0.85rem] text-muted">
        Inicia sessió a la pestanya <strong>Usuaris</strong> per activar el seguiment.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="m-0 text-[0.95rem] font-semibold">Seguiment OwnTracks</h3>
        <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
          <span
            className={`w-2 h-2 rounded-full ${available ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}
            title={available ? 'disponible' : 'no disponible'}
          />
          {available ? 'disponible' : 'no disponible'}
        </span>
      </div>
      {!enabled ? (
        <button
          onClick={handleEnable}
          disabled={loading}
          className={`${primaryButtonClass} w-full`}
          title="Activa OwnTracks i genera credencials"
        >
          {loading ? '⏳' : '🛡️ Activar'}
        </button>
      ) : (
        <div>
          <button
            onClick={handleConfig}
            disabled={loading}
            className={`${secondaryButtonClass} w-full`}
            title="Descarrega el fitxer de configuració OwnTracks"
          >
            {loading ? '⏳' : '📥 Baixar credencials'}
          </button>
          <p className="text-muted text-[0.8rem] mt-2 mb-0">
            Ja tens el seguiment activat. Pots tornar a baixar les credencials d'OwnTracks sempre que vulguis.
          </p>
        </div>
      )}

      <h3 className="mt-5 mb-1 text-[0.95rem] font-semibold">
        Usuaris connectats ({connected.length})
      </h3>
      {connected.length === 0 ? (
        <p className="text-muted text-[0.85rem]">Cap usuari actiu ara mateix.</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {connected.map((p) => (
            <li
              key={p.username}
              className="flex justify-between items-center px-3 py-[10px] border-b border-soft"
            >
              <span className="text-[0.9rem] font-medium text-ink">{p.username}</span>
              <span className="text-[0.8rem] text-muted">{timeAgo(p.ts)}</span>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <Modal title="OwnTracks" onClose={() => setShowModal(false)}>
          <div className="text-[0.9rem] leading-normal">
            <p className="mt-0">Per activar el seguiment de posicions:</p>
            <ol className="pl-[1.2rem] my-2">
              <li>
                Instal·la <strong>OwnTracks</strong> al teu mòbil:
                <div className="mt-[4px] flex gap-2">
                  <a
                    href="https://play.google.com/store/apps/details?id=org.owntracks.android"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.8rem] text-primary"
                  >
                    📱 Android
                  </a>
                  <a
                    href="https://apps.apple.com/app/owntracks/id692424691"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.8rem] text-primary"
                  >
                    🍏 iOS
                  </a>
                </div>
              </li>
              <li className="mt-2">Descarrega el fitxer de configuració</li>
              <li>Obre'l amb OwnTracks per importar-lo</li>
            </ol>
            <p className="text-muted text-[0.8rem] my-2">
              El fitxer conté les credencials del teu usuari. No el comparteixis.
            </p>
            <button
              onClick={downloadCurrent}
              className="w-full p-[10px] bg-primary text-white border-0 rounded text-[0.9rem] cursor-pointer mt-2"
            >
              📥 Baixar {user.username}.otrc
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function centerNode(nodeId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('node', nodeId);
  window.history.replaceState({}, '', url.toString());
  window.dispatchEvent(new CustomEvent('map-force-url-check'));
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-transparent border-0 cursor-pointer p-0 m-0 text-[0.95rem] font-semibold text-ink"
      >
        <span>
          {title} ({count})
        </span>
        <span className="text-muted text-[0.8rem]">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function ReportsTab({
  features,
  incidentFeatures,
}: {
  features: HidrantFeature[];
  incidentFeatures: IncidentFeature[];
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return features;
    const s = search.toLowerCase();
    return features.filter((f) => {
      const ui = f.properties.ui_fields || {};
      const address = `${ui.street || ''} ${ui.num || ''} ${ui.barri || ''}`.toLowerCase();
      return address.includes(s);
    });
  }, [features, search]);

  const centerIncident = (feature: IncidentFeature) => {
    window.dispatchEvent(new CustomEvent('map-center-node', { detail: feature }));
  };

  return (
    <div className="p-4">
      <CollapsibleSection title="Hidrants" count={filtered.length}>
        <input
          type="text"
          placeholder="Cerca per carrer/barri..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} mb-2 p-2! box-border`}
        />
        <div className="max-h-[35vh] overflow-y-auto border border-soft rounded">
          {filtered.length === 0 ? (
            <p className="text-center text-muted p-4 text-[0.85rem]">No s'han trobat hidrants.</p>
          ) : (
            filtered.map((f) => {
              const ui = f.properties.ui_fields || {};
              const address = `${ui.street || ''} ${ui.num || ''}`.trim();
              const neighborhood = ui.barri ? `(${ui.barri})` : '';
              const diameters = ui.diameters ? ui.diameters.split(';').join(', ') + ' mm' : '';
              const isOutOfService = ui.estat === 'Fora de servei';
              return (
                <div
                  key={f.id}
                  onClick={() => centerNode(f.id)}
                  className="flex items-center gap-3 px-3 py-[10px] border-b border-soft cursor-pointer transition-colors duration-100 hover:bg-[#f5f5f5]"
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
                      <span className="font-normal text-muted text-[0.85rem]">{neighborhood}</span>
                    </div>
                    <div className="text-[0.75rem] text-muted flex flex-wrap gap-[4px] mt-[2px]">
                      <span
                        className={`font-medium ${isOutOfService ? 'text-[#d32f2f]' : 'text-[#2e7d32]'}`}
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
      </CollapsibleSection>

      <CollapsibleSection title="Incidències" count={incidentFeatures.length}>
        {incidentFeatures.length === 0 ? (
          <p className="text-muted text-[0.85rem]">No hi ha incidències obertes.</p>
        ) : (
          <div className="max-h-[35vh] overflow-y-auto border border-soft rounded">
            {incidentFeatures.map((f) => {
              const p = f.properties;
              return (
                <div
                  key={f.id}
                  onClick={() => centerIncident(f)}
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
        )}
      </CollapsibleSection>
    </div>
  );
}

function UsersTab() {
  const { user, logout } = useAuth();
  const { activeAdf } = useAdf();

  if (!user) {
    return (
      <div className="p-4">
        <Login />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="m-0 mb-2 text-[0.95rem] font-semibold">Usuari</h3>
      <div className="border border-border rounded p-3 bg-soft">
        <div className="font-semibold text-ink">{user.username}</div>
        <div className="text-muted text-[0.8rem] capitalize mt-[2px]">{user.role}</div>
        {activeAdf && (
          <div className="text-muted text-[0.8rem] mt-[2px]">ADF: {activeAdf.nom}</div>
        )}
      </div>
      <button onClick={logout} className={`${secondaryButtonClass} w-full mt-3`}>
        🔓 Tanca sessió
      </button>
    </div>
  );
}

function ConfigTab() {
  return (
    <div className="p-4 text-[0.85rem] text-muted">
      Contingut de la pestanya Configuració (placeholder).
    </div>
  );
}

function HelpTab() {
  const currentYear = new Date().getFullYear();
  const itemClass = 'flex items-center gap-[15px] mb-[10px]';
  const imgClass = 'w-[25px] h-[41px] object-contain';

  return (
    <div className="p-4">
      <h3 className="m-0 mb-3 text-[0.95rem] font-semibold">Llegenda</h3>
      <h4 className="mt-0 mb-2 text-[0.85rem]">Hidrants</h4>
      <div className={itemClass}>
        <img src={hidrant_op_rev} alt="Verd" className={imgClass} />
        <span className="text-[0.85rem]">Operatiu (revisat {currentYear})</span>
      </div>
      <div className={itemClass}>
        <img src={hidrant_op_nrev} alt="Verd apagat" className={imgClass} />
        <span className="text-[0.85rem]">Operatiu (no revisat {currentYear})</span>
      </div>
      <div className={itemClass}>
        <img src={hidrant_nop_rev} alt="Vermell" className={imgClass} />
        <span className="text-[0.85rem]">Fora de servei (revisat {currentYear})</span>
      </div>
      <div className={itemClass}>
        <img src={hidrant_nop_nrev} alt="Vermell apagat" className={imgClass} />
        <span className="text-[0.85rem]">Fora de servei (no revisat {currentYear})</span>
      </div>
      <div className={itemClass}>
        <img src={hidrant_no_info} alt="Negre" className={imgClass} />
        <span className="text-[0.85rem]">Sense data de revisió coneguda</span>
      </div>
    </div>
  );
}

export function buildTabs({
  features,
  incidentFeatures,
  positions,
}: {
  features: HidrantFeature[];
  incidentFeatures: IncidentFeature[];
  positions: Record<string, Position>;
}): PanelTab[] {
  return [
    { id: 'mapa', icon: '🗺️', label: 'Mapa', content: <MapaTab /> },
    {
      id: 'seguiment',
      icon: '🚶',
      label: 'Seguiment',
      content: <TrackingTab positions={positions} />,
    },
    {
      id: 'informes',
      icon: '📃',
      label: 'Informes',
      content: <ReportsTab features={features} incidentFeatures={incidentFeatures} />,
    },
    { id: 'usuaris', icon: '👤', label: 'Usuaris', content: <UsersTab /> },
    { id: 'config', icon: '⚙️', label: 'Configuració', content: <ConfigTab /> },
    { id: 'ajuda', icon: '📖', label: 'Ajuda', content: <HelpTab /> },
  ];
}
