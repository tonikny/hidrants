import { useState } from 'react';
import {
  hidrant_nop_nrev,
  hidrant_nop_rev,
  hidrant_op_nrev,
  hidrant_op_rev,
} from '../../utils/icons';

export function LegendModal({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const styles = { display: 'flex', alignItems: 'center', gap: '15px' };
  const iconsDir = '/images/icons';

  return (
    <>
      {/* Botó d'informació */}
      <button
        onClick={() => setOpen(true)}
        style={{
          ...style,
          fontWeight: 'bold',
          fontFamily: 'serif',
          fontStyle: 'italic',
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
              <img src={iconsDir + hidrant_op_rev} /> Operatiu (revisat
              {currentYear})
            </div>
            <div style={styles}>
              <img src={iconsDir + hidrant_op_nrev} /> Operatiu (no revisat)
            </div>
            <div style={styles}>
              <img src={iconsDir + hidrant_nop_rev} /> Fora de servei (
              {currentYear})
            </div>
            <div style={styles}>
              <img src={iconsDir + hidrant_nop_nrev} /> Fora de servei (no
              revisat)
            </div>
          </div>
        </button>
      )}
    </>
  );
}
