import React, { useState } from 'react';
import { sendToTelegram } from '../../utils/sendToTelegram';
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
  const [type, setType] = useState('foc');
  const [severity, setSeverity] = useState('mitjana');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendToTelegram({
        lat,
        lon,
        tags: {
          type: 'incidencia',
          incident_type: type,
          severity: severity,
          description: description,
        },
        message: message,
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

      {/* Tipus d'Incidència */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Tipus d'incidència:
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={selectStyle}
          required
        >
          <option value="foc">🔥 Foc de vegetació / forestal</option>
          <option value="obstacle">🚧 Obstacle a la pista / camí</option>
          <option value="aigua">💧 Problema punt d'aigua / canonada</option>
          <option value="altre">⚠️ Altres incidències / Anomalies</option>
        </select>
      </label>

      {/* Gravetat */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Gravetat:
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          style={selectStyle}
          required
        >
          <option value="baixa">🟢 Baixa (No urgent)</option>
          <option value="mitjana">🟡 Mitjana (Cal atenció)</option>
          <option value="alta">🔴 Alta (Urgent! Perillós)</option>
        </select>
      </label>

      {/* Descripció / Detalls */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
        Detalls / Descripció de l'incident:
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Pista tallada per pi caigut, necessitem motoserra..."
          style={{
            ...inputStyle,
            fontFamily: 'inherit',
            height: '60px',
            resize: 'vertical',
            padding: '4px 6px',
          }}
          required
        />
      </label>

      {/* Missatge de Telegram addicional */}
      <label style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
        Missatge per a Telegram (opcional):
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Avís passat a ADF 204..."
          style={{
            ...inputStyle,
            fontFamily: 'inherit',
            height: '40px',
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
            padding: '6px',
            fontSize: '0.75rem',
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Enviant...' : 'Enviar Incidència'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            ...secondaryButtonStyle,
            flex: 1,
            padding: '6px',
            fontSize: '0.75rem',
          }}
        >
          Cancel·la
        </button>
      </div>
    </form>
  );
};
