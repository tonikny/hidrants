import React, { useState } from 'react';
import { useIncidencies } from '../../hooks/useIncidencies';
import { toast } from 'react-toastify';
import {
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  selectStyle,
} from '../../styles/uiStyles';

type NewIncidentFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
};

export const NewIncidentForm = ({
  lat,
  lon,
  onClose,
}: NewIncidentFormProps) => {
  const { createIncident } = useIncidencies();
  const [type, setType] = useState('FOC');
  const [priority, setPriority] = useState('MITJANA');
  const [titol, setTitol] = useState('');
  const [comentari, setComentari] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createIncident({
        titol,
        tipus: type,
        prioritat: priority,
        lat,
        lon,
        comentari
      });
      toast.success('Incidència reportada amb èxit!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error enviant la incidència');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          color: '#555',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <strong>
          [ {lat.toFixed(5)}, {lon.toFixed(5)} ]
        </strong>
      </div>

      {/* Títol */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Títol de la incidència:
        <input
          type="text"
          value={titol}
          onChange={(e) => setTitol(e.target.value)}
          placeholder="Ex: Fum a prop de Can Gall"
          style={inputStyle}
          required
        />
      </label>

      {/* Tipus d'Incidència */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Tipus d'incidència:
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={selectStyle}
          required
        >
          <option value="FOC">🔥 Foc de vegetació / forestal</option>
          <option value="FUM">💨 Columna de fum</option>
          <option value="ACCIDENT">🚗 Accident de trànsit</option>
          <option value="ALTRA">⚠️ Altres incidències / Anomalies</option>
        </select>
      </label>

      {/* Prioritat */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Prioritat:
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={selectStyle}
          required
        >
          <option value="BAIXA">🟢 Baixa (No urgent)</option>
          <option value="MITJANA">🟡 Mitjana (Cal atenció)</option>
          <option value="ALTA">🔴 Alta (Urgent! Perillós)</option>
        </select>
      </label>

      {/* Comentari inicial */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
        Observacions inicials:
        <textarea
          value={comentari}
          onChange={(e) => setComentari(e.target.value)}
          placeholder="Més detalls..."
          style={{
            ...inputStyle,
            fontFamily: 'inherit',
            height: '60px',
            resize: 'vertical',
            padding: '4px 6px',
          }}
        />
      </label>

      {/* Botons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginTop: '0.5rem',
        }}
      >
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...primaryButtonStyle,
            backgroundColor: '#dc3545', // Vermell intens per a incidències
            flex: 1,
            padding: '8px',
            fontSize: '0.8rem',
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Enviant...' : 'Reportar Incidència'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            ...secondaryButtonStyle,
            flex: 1,
            padding: '8px',
            fontSize: '0.8rem',
          }}
        >
          Cancel·la
        </button>
      </div>
    </form>
  );
};
