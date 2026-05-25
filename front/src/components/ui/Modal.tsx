import React from 'react';
import { modalOverlayStyle, popupContainerStyle } from '../../styles/uiStyles';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
  showClose?: boolean;
  nonBlocking?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  children, 
  onClose, 
  title, 
  showClose = true,
  nonBlocking = false
}) => {
  return (
    <div 
      style={{
        ...modalOverlayStyle, 
        pointerEvents: nonBlocking ? 'none' : 'auto', 
        backgroundColor: nonBlocking ? 'transparent' : modalOverlayStyle.backgroundColor
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          ...popupContainerStyle, 
          pointerEvents: 'auto'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
            {showClose && onClose && (
              <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 5px', color: '#666' }}
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
