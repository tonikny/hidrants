import React, { useState } from 'react';
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../styles/uiStyles';

interface CoordinateModalProps {
  onConfirm: (lat: number, lon: number) => void;
  onClose: () => void;
}

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
    <div className="flex flex-col">
      <div className="mb-4 text-center text-[0.9rem] text-[#555]">
        Pots afegir un node manualment fent una pulsació llarga o un clic dret
        en el mapa o entrar les coordenades
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <label className="text-[0.8rem] mt-3 italic">
          Latitud:
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="text-[0.8rem] mt-3 italic">
          Longitud:
          <input
            type="text"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="flex justify-between gap-2 mt-6">
          <button type="submit" className={`${primaryButtonClass} flex-1`}>
            Confirma
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${secondaryButtonClass} flex-1`}
          >
            Cancel·la
          </button>
        </div>
      </form>
    </div>
  );
};
