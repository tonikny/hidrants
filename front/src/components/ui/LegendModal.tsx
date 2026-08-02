import { useState } from 'react';
import { Modal } from './Modal';
import {
  hidrant_nop_nrev,
  hidrant_nop_rev,
  hidrant_op_nrev,
  hidrant_op_rev,
  hidrant_no_info,
} from '../../utils/icons';

export function LegendModal({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const itemClass = 'flex items-center gap-[15px] mb-[10px]';

  const imgClass = 'w-[25px] h-[41px] object-contain';

  return (
    <>
      {/* Botó d'informació */}
      <button
        onClick={() => setOpen(true)}
        className={`${className || ''} font-bold font-serif italic`}
        title="Llegenda"
      >
        i
      </button>

      {/* Finestra modal centrada */}
      {open && (
        <Modal title="Llegenda" onClose={() => setOpen(false)}>
          <div className="p-[0.5rem_0] flex flex-col items-center">
            <div className="text-left w-fit">
              <h4 className="mt-0">Hidrants</h4>
              <div className={itemClass}>
                <img src={hidrant_op_rev} alt="Verd" className={imgClass} />
                <span>Operatiu (revisat {currentYear})</span>
              </div>
              <div className={itemClass}>
                <img src={hidrant_op_nrev} alt="Verd apagat" className={imgClass} />
                <span>Operatiu (no revisat {currentYear})</span>
              </div>
              <div className={itemClass}>
                <img src={hidrant_nop_rev} alt="Vermell" className={imgClass} />
                <span>Fora de servei (revisat {currentYear})</span>
              </div>
              <div className={itemClass}>
                <img
                  src={hidrant_nop_nrev}
                  alt="Vermell apagat"
                  className={imgClass}
                />
                <span>Fora de servei (no revisat {currentYear})</span>
              </div>
              <div className={itemClass}>
                <img src={hidrant_no_info} alt="Negre" className={imgClass} />
                <span>Sense data de revisió coneguda</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
