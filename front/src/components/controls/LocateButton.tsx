import { useGeolocationTracking } from '../../hooks/useGeolocationTracking';
import { useEffect } from 'react';

export function LocateButton({
  style,
  onEdit,
  setPosition,
  setAccuracy,
}: Readonly<{
  style?: React.CSSProperties;
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
      style={{
        ...style,
        backgroundColor: tracking ? '#28a745' : 'white',
        color: tracking ? 'white' : '#333',
      }}
      title={
        tracking
          ? 'Desactiva el seguiment de la teva posició'
          : 'Activa el seguiment de la teva posició'
      }
    >
      📍
    </button>
  );
}
