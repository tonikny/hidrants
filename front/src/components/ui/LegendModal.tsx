import { useState } from 'react';
import { Modal } from './Modal';
import {
  hidrant_nop_nrev,
  hidrant_nop_rev,
  hidrant_op_nrev,
  hidrant_op_rev,
} from '../../utils/icons';

export function LegendModal({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px',
  };

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
        <Modal title="Llegenda" onClose={() => setOpen(false)}>
          <div style={{ padding: '0.5rem 0' }}>
            <h4 style={{ marginTop: 0 }}>Hidrants</h4>
            <div style={itemStyle}>
              <img src={hidrant_op_rev} alt="Verd" />
              <span>Operatiu (revisat {currentYear})</span>
            </div>
            <div style={itemStyle}>
              <img src={hidrant_op_nrev} alt="Verd apagat" />
              <span>Operatiu (no revisat)</span>
            </div>
            <div style={itemStyle}>
              <img src={hidrant_nop_rev} alt="Vermell" />
              <span>Fora de servei ({currentYear})</span>
            </div>
            <div style={itemStyle}>
              <img src={hidrant_nop_nrev} alt="Vermell apagat" />
              <span>Fora de servei (no revisat)</span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
