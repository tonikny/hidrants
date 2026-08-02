// Botó d'activació OwnTracks amb indicador d'estat MQTT i modal d'instruccions.
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from './Modal';
import { toast } from 'react-toastify';

interface TrackingToggleProps { className?: string; }

export const TrackingToggle: React.FC<TrackingToggleProps> = ({ className }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const otrcRef = useRef<Record<string, unknown> | null>(null);

  // Poll estat MQTT cada 5 minuts per actualitzar el punt d'estat.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/tracking/status', { credentials: 'same-origin' });
        if (res.ok) { const data = await res.json(); setAvailable(data.available); }
      } catch { /* ignore */ }
    };
    poll();
    const t = setInterval(poll, 300000);
    return () => clearInterval(t);
  }, []);

  if (!user) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking/enable', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Error activant OwnTracks'); return; }
      const otrc = await res.json();
      otrcRef.current = otrc;
      setShowModal(true);
    } catch { toast.error('Error de connexió'); }
    finally { setLoading(false); }
  };

  const handleConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking/config', { credentials: 'same-origin' });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Error descarregant config'); return; }
      const otrc = await res.json();
      otrcRef.current = otrc;
      setShowModal(true);
    } catch { toast.error('Error de connexió'); }
    finally { setLoading(false); }
  };

  const downloadCurrent = () => {
    if (!otrcRef.current || !user) return;
    downloadOtrc(otrcRef.current, user.username);
  };

  return (
    <>
      <div className="relative inline-flex">
        {user.mqtt_enabled && (
          <div className={`w-2 h-2 rounded-full border-[1.5px] border-white absolute top-[1px] right-[1px] z-[991] ${available ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}
            title={available ? 'MQTT disponible' : 'MQTT no disponible'}
          />
        )}
        <button
          onClick={user.mqtt_enabled ? handleConfig : handleEnable}
          disabled={loading}
          className={className}
          title={(user.mqtt_enabled ? 'Veure config OwnTracks' : 'Activar OwnTracks') + (available ? '' : ' (MQTT no disponible)')}
        >
          {loading ? '⏳' : '🚶'}
        </button>
      </div>
      {showModal && (
        <Modal title="OwnTracks" onClose={() => setShowModal(false)}>
          <div className="text-[0.9rem] leading-normal">
            <p className="mt-0">Per activar el seguiment de posicions:</p>
            <ol className="pl-[1.2rem] my-2">
              <li>Instal·la <strong>OwnTracks</strong> al teu mòbil:
                <div className="mt-[4px] flex gap-2">
                  <a href="https://play.google.com/store/apps/details?id=org.owntracks.android" target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-primary">📱 Android</a>
                  <a href="https://apps.apple.com/app/owntracks/id692424691" target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-primary">🍏 iOS</a>
                </div>
              </li>
              <li className="mt-2">Descarrega el fitxer de configuració</li>
              <li>Obre'l amb OwnTracks per importar-lo</li>
            </ol>
            <p className="text-muted text-[0.8rem] my-2">El fitxer conté les credencials del teu usuari. No el comparteixis.</p>
            <button onClick={downloadCurrent}
              className="w-full p-[10px] bg-primary text-white border-0 rounded text-[0.9rem] cursor-pointer mt-2">
              📥 Baixar {user.username}.otrc
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

function downloadOtrc(otrc: Record<string, unknown>, username: string) {
  const blob = new Blob([JSON.stringify(otrc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${username}.otrc`;
  a.click();
  URL.revokeObjectURL(url);
}