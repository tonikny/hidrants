import { useState } from 'react';

export function LegendModal() {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const styles = { display: 'flex', alignItems: 'center', gap: '15px' };

  return (
    <>
      {/* Botó d'informació */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: '9rem',
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
            <h4>Hidrants</h4>
            <div style={styles}>
              <img src="/images/icons/marker-icon-blue.png" /> Operatiu (revisat
              ${currentYear})
            </div>
            <div style={styles}>
              <img src="/images/icons/marker-icon-grey.png" /> Operatiu (no
              revisat)
            </div>
            <div style={styles}>
              <img src="/images/icons/marker-icon-red.png" /> Fora de servei ($
              {currentYear})
            </div>
            <div style={styles}>
              <img src="/images/icons/marker-icon-orange.png" /> Fora de servei
              (no revisat)
            </div>
          </div>
        </button>
      )}
    </>
  );
}
