import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';

interface Props {
  setClickedPosition: (pos: LatLng) => void;
  setActiveForm: (form: 'selection' | 'hydrant' | 'incident' | null) => void;
  user: any; // replace with proper user type if available
}

export default function MapRightClickHandler({
  setClickedPosition,
  setActiveForm,
  user,
}: Props) {
  const map = useMap();

  useEffect(() => {
    const handleContextMenu = (e: any) => {
      if (!user) return;
      // Prevent default browser context menu
      if (e.originalEvent?.preventDefault) e.originalEvent.preventDefault();
      setClickedPosition(e.latlng);
      setActiveForm('selection');
    };
    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, setClickedPosition, setActiveForm, user]);

  return null;
}
