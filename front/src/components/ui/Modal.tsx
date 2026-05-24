import React from 'react';
import { modalOverlayStyle, popupContainerStyle } from '../../styles/uiStyles';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose, title, showClose = true }) => {
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
        {(title || showClose) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h2>
            {showClose && onClose && (
              <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px', color: '#666' }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
