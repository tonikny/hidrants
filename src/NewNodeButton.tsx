import { useState } from 'react';
import { NewNodeModal } from './NewNodeModal';

export function NewNodeButton({ style }: { style?: React.CSSProperties }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() =>
          setMessage(
            'Per afegir un node manualment, fes una pulsació llarga o un clic dret en el mapa'
          )
        }
        style={style}
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
