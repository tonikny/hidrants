import React, { useEffect, useState } from 'react';
import { MunicipiData } from '../contexts/MunicipiContext';

export const MunicipiSelector: React.FC = () => {
  const [municipis, setMunicipis] = useState<MunicipiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/municipis')
      .then(res => res.json())
      .then(data => {
        setMunicipis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error carregant municipis:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregant municipis...
      </div>
    );
  }

  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  const configuredDomain = import.meta.env.VITE_BASE_DOMAIN_URL;

  // Determinem el domini base per construir les URLs dels municipis
  let baseDomain = configuredDomain || hostname;

  // Si és una IP (per accedir des del mòbil), forcem l'ús de nip.io per permetre subdominis
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  if (isIP) {
    baseDomain = `${hostname}.nip.io`;
  } else if (hostname.endsWith('.nip.io')) {
    // Si ja estem a un domini nip.io, mantenim la base (IP.nip.io)
    const parts = hostname.split('.');
    if (parts.length >= 6) {
      baseDomain = parts.slice(-6).join('.');
    }
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
        <p style={{ color: '#666', marginBottom: '30px' }}>Escull un municipi per veure el mapa</p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '20px'
        }}>
          {municipis.map(m => {
            const url = `${protocol}//${m.slug}.${baseDomain}${port}`;

            return (
              <a
                key={m.slug}
                href={url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  backgroundColor: '#fff',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#333',
                  fontWeight: '600',
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
                {m.name}
              </a>
            );
          })}
        </div>

        <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#999' }}>
          ADF - Gestió d'Hidrants d'Incendis
        </div>
      </div>
    </div>
  );
};
