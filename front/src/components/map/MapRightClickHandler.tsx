import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type L from 'leaflet';
import type { User } from '../../contexts/AuthContext';

interface Props {
  onCreate: (latlng: L.LatLng) => void;
  user: User | null;
}

export default function MapRightClickHandler({ onCreate, user }: Props) {
  const map = useMap();

  useEffect(() => {
    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      if (!user) {return;}
      if (e.originalEvent?.preventDefault) {e.originalEvent.preventDefault();}
      onCreate(e.latlng);
    };
    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, onCreate, user]);

  return null;
}