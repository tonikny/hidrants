import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { point } from 'leaflet';

export const MapClickHandler = ({
  onClick,
  onCancel,
  isActive,
}: {
  onClick: (latlng: L.LatLng) => void;
  onCancel: () => void;
  isActive: boolean;
}) => {
  const map = useMap();
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      hasOpenedRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    const handleClick = () => {
      if (isActive) {return;}
      onCancel();
    };

    let touchTimeout: ReturnType<typeof setTimeout>;
    let touchStartPoint: { x: number; y: number } | null = null;
    const TOUCH_MOVE_THRESHOLD = 10;

    const handleTouchStart = (e: TouchEvent) => {
      if (isActive) {return;}
      if (e.touches.length > 1) {return;}

      const touch = e.touches[0];
      const p = point(touch.clientX, touch.clientY);
      const latlng = map.containerPointToLatLng(p);

      touchStartPoint = p;

      touchTimeout = setTimeout(() => {
        if (hasOpenedRef.current) {return;}
        hasOpenedRef.current = true;
        onClick(latlng);
      }, 800);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        clearTimeout(touchTimeout);
        return;
      }
      if (!touchStartPoint) {return;}

      const touch = e.touches[0];
      const current = point(touch.clientX, touch.clientY);

      const dx = current.x - touchStartPoint.x;
      const dy = current.y - touchStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > TOUCH_MOVE_THRESHOLD) {
        clearTimeout(touchTimeout);
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      if (!hasOpenedRef.current && !isActive) {
        onCancel();
      }
      hasOpenedRef.current = false;
    };

    const handleMoveStart = () => {};
    const handleZoomStart = () => {};

    const container = map.getContainer();
    map.on('click', handleClick);
    map.on('movestart', handleMoveStart);
    map.on('zoomstart', handleZoomStart);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      map.off('click', handleClick);
      map.off('movestart', handleMoveStart);
      map.off('zoomstart', handleZoomStart);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [map, onClick, onCancel, isActive]);

  return null;
};