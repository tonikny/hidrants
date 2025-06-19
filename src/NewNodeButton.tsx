import { useState } from 'react';
// import { NewNodeModal } from './NewNodeModal';
import { toast } from 'react-toastify';

export function NewNodeButton({
  style,
}: Readonly<{ style?: React.CSSProperties }>) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() =>
          toast.info(
            'Per afegir un node manualment, fes una pulsació llarga o un clic dret en el mapa'
          )
        }
        //   setMessage(
        //     'Per afegir un node manualment, fes una pulsació llarga o un clic dret en el mapa'
        //   )
        // }
        style={style}
        title="Afegir node manualment"
      >
        +
      </button>

      {/* {message && (
        <NewNodeModal message={message} onClose={() => setMessage(null)} />
      )} */}
    </>
  );
}
