import React from 'react';
import { useAdf } from '../../contexts/AdfContext';
import { Modal } from './Modal';

export const AdfSelector: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { adfs, isLoading, setActiveAdf, activeAdf } = useAdf();

  if (isLoading) {
    return (
      <Modal title="Xarxa d'Hidrants" showClose={false}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>Carregant ADFs...</div>
      </Modal>
    );
  }

  return (
    <Modal 
      title="Xarxa d'Hidrants" 
      onClose={activeAdf ? onClose : undefined} 
      showClose={!!activeAdf}
    >
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Escull una ADF per veure el mapa
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '10px',
        maxHeight: '50vh',
        overflowY: 'auto',
        padding: '5px'
      }}>
        {adfs.map(adf => (
          <button
            key={adf.id}
            onClick={() => {
              setActiveAdf(adf);
              if (onClose) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '15px 10px',
              backgroundColor: activeAdf?.id === adf.id ? '#e3f2fd' : '#fff',
              border: `1px solid ${activeAdf?.id === adf.id ? '#2196f3' : '#e0e0e0'}`,
              borderRadius: '6px',
              color: '#333',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            {adf.nom}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
        Gestió d'Hidrants d'Incendis
      </div>
    </Modal>
  );
};
