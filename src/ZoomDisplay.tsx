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
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        zIndex: 1000,
      }}
    >
      Zoom: {zoom}
    </div>
  );
};

export default ZoomDisplay;
