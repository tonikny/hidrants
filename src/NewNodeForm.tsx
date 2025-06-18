import { useState } from 'react';
import { sendToTelegram } from './sendToTelegram';

type NodeFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
};

export const NewNodeForm = ({ lat, lon, onClose }: NodeFormProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendToTelegram({ lat, lon, message });
      alert('Missatge enviat!');
      setMessage('');
      onClose();
    } catch (err) {
      console.log(err);
      alert('Error enviant el missatge');
    }
  };
  return (
    <div
      className="form-popup"
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: '#fff',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <form onSubmit={handleSubmit}>
        <p>
          <strong>Nova proposta de node</strong>
        </p>
        <p>
          📍 {lat.toFixed(5)}, {lon.toFixed(5)}
        </p>
        <textarea
          placeholder="Comentari o descripció"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <br />
        <button type="submit">Enviar</button>
        <button type="button" onClick={onClose}>
          Cancel·la
        </button>
      </form>
    </div>
  );
};
