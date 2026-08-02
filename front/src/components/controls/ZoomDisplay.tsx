import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

export const ZoomDisplay = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', onZoom);

    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  return (
    <div className="bg-white px-2 py-[2px] border border-border rounded text-[0.75rem] text-ink shadow-[0_1px_5px_rgba(0,0,0,0.4)] font-bold">
      Zoom: {zoom}
    </div>
  );
};

export default ZoomDisplay;
