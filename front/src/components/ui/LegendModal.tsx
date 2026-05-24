import { useState } from 'react';
import { Modal } from './Modal';

export function LegendModal({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const itemStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' };

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
              <img src="/images/icons/marker-icon-blue.png" alt="Blau" /> 
              <span>Operatiu (revisat {currentYear})</span>
            </div>
            <div style={itemStyle}>
              <img src="/images/icons/marker-icon-grey.png" alt="Gris" /> 
              <span>Operatiu (no revisat)</span>
            </div>
            <div style={itemStyle}>
              <img src="/images/icons/marker-icon-red.png" alt="Vermell" /> 
              <span>Fora de servei ({currentYear})</span>
            </div>
            <div style={itemStyle}>
              <img src="/images/icons/marker-icon-orange.png" alt="Taronja" /> 
              <span>Fora de servei (no revisat)</span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
