import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';

interface Props {
  setClickedPosition: (pos: LatLng) => void;
  setShowNewForm: (show: boolean) => void;
  user: any; // replace with proper user type if available
}

export default function MapRightClickHandler({
  setClickedPosition,
  setShowNewForm,
  user,
}: Props) {
  const map = useMap();

  useEffect(() => {
    const handleContextMenu = (e: any) => {
      if (!user) return;
      // Prevent default browser context menu
      if (e.originalEvent?.preventDefault) e.originalEvent.preventDefault();
      setClickedPosition(e.latlng);
      setShowNewForm(true);
    };
    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, setClickedPosition, setShowNewForm, user]);

  return null;
}
