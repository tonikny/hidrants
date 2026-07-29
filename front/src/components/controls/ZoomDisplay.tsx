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
        background: 'white',
        padding: '2px 8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: '#333',
        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
        fontWeight: 'bold',
      }}
    >
      Zoom: {zoom}
    </div>
  );
};

export default ZoomDisplay;
