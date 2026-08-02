import { useGeolocationTracking } from '../../hooks/useGeolocationTracking';
import { useEffect } from 'react';

export function LocateButton({
  className,
  onEdit,
  setPosition,
  setAccuracy,
}: Readonly<{
  className?: string;
  onEdit?: (latlng: L.LatLng) => void;
  setPosition: (latlng: L.LatLng | null) => void;
  setAccuracy?: (accuracy: number | null) => void;
}>) {
  const { tracking, setTracking, position, accuracy } =
    useGeolocationTracking(onEdit);

  useEffect(() => {
    setPosition(position ?? null);
  }, [position, setPosition]);

  useEffect(() => {
    if (setAccuracy) setAccuracy(accuracy ?? null);
  }, [accuracy, setAccuracy]);

  return (
    <button
      onClick={() => setTracking((prev) => !prev)}
      className={`${className || ''} ${tracking ? 'bg-[#28a745] text-white' : 'bg-white text-ink'}`}
      title={
        tracking
          ? 'Desactiva el seguiment de la teva posició'
          : 'Activa el seguiment de la teva posició'
      }
    >
      🛰️
    </button>
  );
}
