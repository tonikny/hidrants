import { useState } from 'react';
import { Modal } from './Modal';
import {
  hidrant_nop_nrev,
  hidrant_nop_rev,
  hidrant_op_nrev,
  hidrant_op_rev,
  hidrant_no_info,
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

  const imgStyle = {
    width: '25px',
    height: '41px',
    objectFit: 'contain' as const,
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
          <div
            style={{
              padding: '0.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'left', width: 'fit-content' }}>
              <h4 style={{ marginTop: 0 }}>Hidrants</h4>
              <div style={itemStyle}>
                <img src={hidrant_op_rev} alt="Verd" style={imgStyle} />
                <span>Operatiu (revisat {currentYear})</span>
              </div>
              <div style={itemStyle}>
                <img src={hidrant_op_nrev} alt="Verd apagat" style={imgStyle} />
                <span>Operatiu (no revisat {currentYear})</span>
              </div>
              <div style={itemStyle}>
                <img src={hidrant_nop_rev} alt="Vermell" style={imgStyle} />
                <span>Fora de servei ({currentYear})</span>
              </div>
              <div style={itemStyle}>
                <img
                  src={hidrant_nop_nrev}
                  alt="Vermell apagat"
                  style={imgStyle}
                />
                <span>Fora de servei (no revisat {currentYear})</span>
              </div>
              <div style={itemStyle}>
                <img src={hidrant_no_info} alt="Negre" style={imgStyle} />
                <span>Sense data de revisió coneguda</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
