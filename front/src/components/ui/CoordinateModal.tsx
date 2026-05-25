import React, { useState } from 'react';
import {
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../../styles/uiStyles';

type CoordinateModalProps = {
  onConfirm: (lat: number, lon: number) => void;
  onClose: () => void;
};

export const CoordinateModal = ({
  onConfirm,
  onClose,
}: CoordinateModalProps) => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      onConfirm(parsedLat, parsedLon);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
        Pots afegir un node manualment fent una pulsació llarga o un clic dret
        en el mapa o entrar les coordenades
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <label
          style={{
            fontSize: '0.8rem',
            marginTop: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Latitud:
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label
          style={{
            fontSize: '0.8rem',
            marginTop: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Longitud:
          <input
            type="text"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginTop: '1.5rem',
          }}
        >
          <button type="submit" style={{ ...primaryButtonStyle, flex: 1 }}>
            Confirma
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...secondaryButtonStyle, flex: 1 }}
          >
            Cancel·la
          </button>
        </div>
      </form>
    </div>
  );
};
