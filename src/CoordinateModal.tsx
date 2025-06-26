import React, { useState } from 'react';
import {
  inputStyle,
  popupContainerStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from './styles/formStyles';
import { text } from 'stream/consumers';

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
    <div style={popupContainerStyle}>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        Pots afegir un node manualment fent una pulsació llarga o un clic dret
        en el mapa o entrar les coordenades
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          📍 Coordenades
        </h2>

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
            marginTop: '1rem',
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
