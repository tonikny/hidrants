import { useState } from 'react';
import { NewNodeModal } from './NewNodeModal';

export function NewNodeButton() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() =>
          setMessage(
            'Per afegir un node manualment, fes una pulsació llarga o un clic dret en el mapa'
          )
        }
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        title="Afegir node manualment"
      >
        +
      </button>

      {message && (
        <NewNodeModal message={message} onClose={() => setMessage(null)} />
      )}
    </>
  );
}
