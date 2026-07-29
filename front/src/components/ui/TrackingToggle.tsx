// Botó d'activació OwnTracks amb indicador d'estat MQTT i modal d'instruccions.
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from './Modal';
import { toast } from 'react-toastify';

interface TrackingToggleProps { style?: React.CSSProperties; }

export const TrackingToggle: React.FC<TrackingToggleProps> = ({ style }) => {
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
      const res = await fetch('/api/tracking/enable', { method: 'POST' });
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
      const res = await fetch('/api/tracking/config');
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
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {user.mqtt_enabled && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: available ? '#22c55e' : '#ef4444',
            border: '1.5px solid white',
            position: 'absolute', top: 1, right: 1, zIndex: 991,
          }}
            title={available ? 'MQTT disponible' : 'MQTT no disponible'}
          />
        )}
        <button
          onClick={user.mqtt_enabled ? handleConfig : handleEnable}
          disabled={loading}
          style={style}
          title={(user.mqtt_enabled ? 'Veure config OwnTracks' : 'Activar OwnTracks') + (available ? '' : ' (MQTT no disponible)')}
        >
          {loading ? '⏳' : '🚶'}
        </button>
      </div>
      {showModal && (
        <Modal title="OwnTracks" onClose={() => setShowModal(false)}>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            <p style={{ marginTop: 0 }}>Per activar el seguiment de posicions:</p>
            <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
              <li>Instal·la <strong>OwnTracks</strong> al teu mòbil:
                <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                  <a href="https://play.google.com/store/apps/details?id=org.owntracks.android" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#007bff' }}>📱 Android</a>
                  <a href="https://apps.apple.com/app/owntracks/id692424691" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#007bff' }}>🍏 iOS</a>
                </div>
              </li>
              <li style={{ marginTop: '8px' }}>Descarrega el fitxer de configuració</li>
              <li>Obre'l amb OwnTracks per importar-lo</li>
            </ol>
            <p style={{ color: '#666', fontSize: '0.8rem', margin: '0.5rem 0' }}>El fitxer conté les credencials del teu usuari. No el comparteixis.</p>
            <button onClick={downloadCurrent}
              style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
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