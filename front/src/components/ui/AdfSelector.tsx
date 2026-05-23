import React from 'react';
import { useAdf } from '../../contexts/AdfContext';

export const AdfSelector: React.FC = () => {
  const { adfs, isLoading, setActiveAdf } = useAdf();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregant ADFs...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Xarxa d'Hidrants</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Escull una ADF per veure el mapa</p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          {adfs.map(adf => (
            <button
              key={adf.id}
              onClick={() => setActiveAdf(adf)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: '#fff',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                color: '#333',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3498db';
                e.currentTarget.style.backgroundColor = '#f7fbfe';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {adf.nom} ({adf.id})
            </button>
          ))}
        </div>

        <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#999' }}>
          Gestió d'Hidrants d'Incendis
        </div>
      </div>
    </div>
  );
};
