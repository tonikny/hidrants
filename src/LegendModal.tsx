import { useState } from 'react';

export function LegendModal() {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Botó d'informació */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '4.5rem', // separació del botó "+"
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
        title="Llegenda"
      >
        i
      </button>

      {/* Finestra modal centrada */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          aria-label="Tanca la llegenda"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            // onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              opacity: '80%',
              padding: '1rem 2rem',
              borderRadius: '10px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
              textAlign: 'left',
            }}
          >
            <h4>Llegenda dels hidrants</h4>
            <ul
              style={{ listStyle: 'none', paddingLeft: 0, lineHeight: '1.8' }}
            >
              <li>
                <img src="/images/icons/marker-icon-blue.png" width={20} />{' '}
                Operatiu (revisat {currentYear})
              </li>
              <li>
                <img src="/images/icons/marker-icon-grey.png" width={20} />{' '}
                Operatiu (no revisat)
              </li>
              <li>
                <img src="/images/icons/marker-icon-red.png" width={20} /> Fora
                de servei ({currentYear})
              </li>
              <li>
                <img src="/images/icons/marker-icon-orange.png" width={20} />{' '}
                Fora de servei (no revisat)
              </li>
            </ul>
          </div>
        </button>
      )}
    </>
  );
}
