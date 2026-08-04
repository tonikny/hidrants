import { useState } from 'react';
import { useAdf } from '../../contexts/AdfContext';
import { sendToTelegram } from '../../utils/sendToTelegram';
import { toast } from 'react-toastify';
import type { HidrantFeature } from '../../hooks/useHidrantData';
import { inputClass, primaryButtonClass } from '../../styles/uiStyles';

export function TelegramNotifyBox({ feature }: { feature: HidrantFeature }) {
  const [message, setMessage] = useState('');
  const { activeAdf } = useAdf();
  const poi = {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };

  const handleSend = async () => {
    try {
      await sendToTelegram({
        lat: poi.lat,
        lon: poi.lng,
        tags: feature.properties,
        message,
        adf_id: activeAdf?.id,
        isEdit: false,
      });
      toast.success('Notificació enviada');
      setMessage('');
    } catch {
      toast.error('Error enviant la notificació');
    }
  };

  return (
    <div className="border-t border-soft pt-2">
      <textarea
        placeholder="Enviar informació sobre aquest hidrant ..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className={`${inputClass} w-full p-[6px] text-[0.8rem] font-inherit`}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleSend();
        }}
        className={`${primaryButtonClass} w-full mt-2 py-[8px] text-[0.8rem] flex items-center justify-center gap-2`}
      >
        Notificar <span className="text-[1rem]">➤</span>
      </button>
    </div>
  );
}