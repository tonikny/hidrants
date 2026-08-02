import React from 'react';
import { useAdf } from '../../contexts/AdfContext';
import { Modal } from './Modal';

export const AdfSelector: React.FC<{ onClose?: () => void }> = ({
  onClose,
}) => {
  const { adfs, isLoading, setActiveAdf, activeAdf } = useAdf();

  if (isLoading) {
    return (
      <Modal title="Xarxa d'Hidrants" showClose={false}>
        <div className="text-center p-8">Carregant ADFs...</div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Xarxa d'Hidrants"
      onClose={activeAdf ? onClose : undefined}
      showClose={!!activeAdf}
    >
      <p className="text-muted text-[0.9rem] mb-6">
        Escull una ADF per veure el mapa
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-[10px] max-h-[50vh] overflow-y-auto p-[5px]">
        {adfs.map((adf) => (
          <button
            key={adf.id}
            onClick={() => {
              setActiveAdf(adf);
              if (onClose) onClose();
            }}
            className={`flex items-center justify-center px-[10px] py-[15px] border rounded-[6px] text-ink font-semibold text-[0.85rem] cursor-pointer transition-all text-center ${
              activeAdf?.id === adf.id
                ? 'bg-[#e3f2fd] border-[#2196f3]'
                : 'bg-white border-[#e0e0e0]'
            }`}
          >
            {adf.nom}
          </button>
        ))}
      </div>

      <div className="mt-6 text-[0.75rem] text-faint text-center">
        Gestió d'Hidrants d'Incendis
      </div>
    </Modal>
  );
};
