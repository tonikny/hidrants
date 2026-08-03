import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Props {
  onCreate: (latlng: L.LatLng) => void;
  user: any;
}

export default function MapRightClickHandler({ onCreate, user }: Props) {
  const map = useMap();

  useEffect(() => {
    const handleContextMenu = (e: any) => {
      if (!user) return;
      if (e.originalEvent?.preventDefault) e.originalEvent.preventDefault();
      onCreate(e.latlng);
    };
    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, onCreate, user]);

  return null;
}