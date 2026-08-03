import React from 'react';
import { createPortal } from 'react-dom';
import { modalOverlayClass, popupContainerClass } from '../../styles/uiStyles';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
  showClose?: boolean;
  nonBlocking?: boolean;
  containerStyle?: React.CSSProperties;
}

export const Modal: React.FC<ModalProps> = ({ 
  children, 
  onClose, 
  title, 
  showClose = true,
  nonBlocking = false,
  containerStyle = {}
}) => {
  const content = (
    <div
      className={`${modalOverlayClass} ${nonBlocking ? 'pointer-events-none bg-transparent' : 'pointer-events-auto'}`}
      onClick={onClose}
    >
      <div
        className={`${popupContainerClass} pointer-events-auto`}
        style={containerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="m-0 text-[1.1rem]">{title}</h2>
            {showClose && onClose && (
              <button
                onClick={onClose}
                className="bg-transparent border-0 text-[1.4rem] cursor-pointer p-0 px-[5px] text-muted"
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

  return createPortal(content, document.body);
};
