import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import { toast } from 'react-toastify';
import { isPointInBoundary } from '../../utils/geo';

interface Props {
  setClickedPosition: (pos: LatLng) => void;
  setActiveForm: (form: 'selection' | 'hydrant' | 'incident' | null) => void;
  user: any;
  boundaryGeojson: string | null;
}

export default function MapRightClickHandler({
  setClickedPosition,
  setActiveForm,
  user,
  boundaryGeojson,
}: Props) {
  const map = useMap();

  useEffect(() => {
    const handleContextMenu = (e: any) => {
      if (!user) return;
      if (e.originalEvent?.preventDefault) e.originalEvent.preventDefault();
      if (!isPointInBoundary(e.latlng.lat, e.latlng.lng, boundaryGeojson)) {
        toast.warning('Coordenades fora del límit de l\'ADF');
        return;
      }
      setClickedPosition(e.latlng);
      setActiveForm('selection');
    };
    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, setClickedPosition, setActiveForm, user, boundaryGeojson]);

  return null;
}
