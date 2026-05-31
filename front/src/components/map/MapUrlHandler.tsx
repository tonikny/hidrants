import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { toast } from 'react-toastify';
import { useAdf } from '../../contexts/AdfContext';

interface MapUrlHandlerProps {
  features: any[];
}

/**
 * Gestiona l'obertura programàtica de nodes des de la URL (?node=ID)
 * Si el node no existeix, mostra un avís i neteja la URL.
 */
export function MapUrlHandler({ features }: MapUrlHandlerProps) {
  const map = useMap();
  const { activeAdf } = useAdf();
  const lastNodeId = useRef<string | null>(null);
  const fittedAdfId = useRef<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nodeId = urlParams.get('node');
    
    if (nodeId && features.length > 0 && nodeId !== lastNodeId.current) {
      const feature = features.find(f => f.id === nodeId);
      
      if (feature) {
        lastNodeId.current = nodeId;
        const [lon, lat] = feature.geometry.coordinates;
        
        // @ts-ignore
        if (map && map._loaded && map.getContainer().clientWidth > 0) {
          map.stop();

          const onAnimationEnd = () => {
            const center = map.getCenter();
            const dist = center.distanceTo([lat, lon]);
            
            if (dist < 1) {
              map.off('moveend zoomend', onAnimationEnd);
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('map-node-centered', { detail: { nodeId } }));
              }, 300);
            }
          };

          map.on('moveend zoomend', onAnimationEnd);
          map.flyTo([lat, lon], 18, { animate: true, duration: 1.5 });
        }
      } else {
        // Node no trobat
        toast.warn(`No s'ha trobat el node: ${nodeId}`);
        lastNodeId.current = nodeId; 
        
        // Netegem el paràmetre de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete('node');
        window.history.replaceState({}, '', url.toString());

        // Forcem el fitBounds de l'ADF com si no haguéssim tingut node
        if (activeAdf && fittedAdfId.current !== activeAdf.id) {
          // @ts-ignore
          if (map && map._loaded && map.getContainer().clientWidth > 0) {
            if (activeAdf.bbox) {
              const bbox = activeAdf.bbox;
              map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]);
            } else if (activeAdf.center) {
              map.setView(activeAdf.center, 14);
            }
            fittedAdfId.current = activeAdf.id;
          }
        }
      }
    }
  }, [features, map, activeAdf]);

  return null;
}
