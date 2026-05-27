import React, { useState } from 'react';
import {
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../../styles/uiStyles';

interface CreationSelectorProps {
  onSelectHydrant: () => void;
  onSelectIncident: () => void;
  onClose: () => void;
}

export const CreationSelector: React.FC<CreationSelectorProps> = ({
  onSelectHydrant,
  onSelectIncident,
  onClose,
}) => {
  const [hoveredCard, setHoveredCard] = useState<'hydrant' | 'incident' | null>(
    null
  );

  const cardStyle = (type: 'hydrant' | 'incident'): React.CSSProperties => {
    const isHovered = hoveredCard === type;
    const isHydrant = type === 'hydrant';
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.25rem',
      borderRadius: '8px',
      border: `2px solid ${
        isHovered ? (isHydrant ? '#007bff' : '#dc3545') : '#e0e0e0'
      }`,
      backgroundColor: isHovered
        ? isHydrant
          ? '#f0f7ff'
          : '#fff5f5'
        : '#fcfcfc',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
      flex: 1,
      minWidth: '100px',
      textAlign: 'center',
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '0.5rem 0',
      }}
    >
      <div
        style={{
          color: '#666',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}
      >
        Què vols afegir en aquesta ubicació?
      </div>

      <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        {/* Card Hidrant */}
        <div
          style={cardStyle('hydrant')}
          onMouseEnter={() => setHoveredCard('hydrant')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={onSelectHydrant}
        >
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</span>
          <strong
            style={{ fontSize: '1rem', color: '#333', marginBottom: '0.25rem' }}
          >
            Nou Hidrant
          </strong>
          <span
            style={{ fontSize: '0.75rem', color: '#777', lineHeight: '1.2' }}
          >
            Registra un nou hidrant amb dades tècniques.
          </span>
        </div>

        {/* Card Incidència */}
        <div
          style={cardStyle('incident')}
          onMouseEnter={() => setHoveredCard('incident')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={onSelectIncident}
        >
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</span>
          <strong
            style={{ fontSize: '1rem', color: '#333', marginBottom: '0.25rem' }}
          >
            Incidència
          </strong>
          <span
            style={{ fontSize: '0.75rem', color: '#777', lineHeight: '1.2' }}
          >
            Reporta un foc, obstacle, o anomalia a la zona.
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '0.5rem',
        }}
      >
        <button
          onClick={onClose}
          style={{
            ...secondaryButtonStyle,
            padding: '8px 16px',
            fontSize: '0.8rem',
            width: 'auto',
          }}
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
};
