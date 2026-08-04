import { useGeolocationTracking } from '../../hooks/useGeolocationTracking';
import { useEffect } from 'react';

export function LocateButton({
  className,
  setPosition,
  setAccuracy,
}: Readonly<{
  className?: string;
  setPosition: (latlng: L.LatLng | null) => void;
  setAccuracy?: (accuracy: number | null) => void;
}>) {
  const { tracking, toggleTracking, position, accuracy } = useGeolocationTracking();

  useEffect(() => {
    setPosition(position ?? null);
  }, [position, setPosition]);

  useEffect(() => {
    if (setAccuracy) {setAccuracy(accuracy ?? null);}
  }, [accuracy, setAccuracy]);

  return (
    <button
      onClick={toggleTracking}
      className={`${className || ''} relative`}
      title={
        tracking
          ? 'Desactiva el seguiment de la teva posició'
          : 'Activa el seguiment de la teva posició'
      }
    >
      🛰️
      {tracking && (
        <span className="w-2 h-2 rounded-full bg-[#22c55e] border-[1.5px] border-white absolute top-[1px] right-[1px]" />
      )}
    </button>
  );
}
