import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useAdf } from '../../contexts/AdfContext';

const MAP_POS_KEY = 'hidrants_map_pos';

interface MapPos {
  adfId: number;
  lat: number;
  lon: number;
  zoom: number;
}

// Persistència de posició/zoom de l'ADF actual: clau única (no per ADF) que es
// desa a cada moveend/zoomend d'usuari i només es restaura a la recàrrega si
// l'ADF desada coincideix amb l'activa. Quan es canvia de vista d'ADF (elegir
// àmbit territorial) s'esborra la pos desada i es torna a l'estat inicial
// (fitBounds del bbox, o centre+zoom 14). ?node= a la URL té prioritat. Sense
// animació per no xocar amb els markers del mapa en canviar d'ADF.
export function MapViewPersist() {
  const map = useMap();
  const { activeAdf } = useAdf();
  const handledAdfId = useRef<number | null>(null);
  const restoring = useRef(false);

  useEffect(() => {
    if (!map) {return;}
    const adfId = activeAdf?.id;
    if (adfId === undefined) {return;}
    const isInitial = handledAdfId.current === null;
    if (handledAdfId.current === adfId) {return;}
    handledAdfId.current = adfId;

    if (new URLSearchParams(window.location.search).has('node')) {return;}

    // Al canviar d'ADF s'esborra la pos desada: la posició només pertany a
    // l'ADF que es veia en aquell moment.
    if (!isInitial) {localStorage.removeItem(MAP_POS_KEY);}

    // Només a la càrrega inicial (una recàrrega) es restaura la pos desada i
    // només si la va generar la mateixa ADF activa. En canvi d'ADF → fitBounds.
    let saved: MapPos | null = null;
    if (isInitial) {
      const raw = localStorage.getItem(MAP_POS_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MapPos;
          if (
            parsed.adfId === adfId &&
            typeof parsed.lat === 'number' &&
            typeof parsed.lon === 'number' &&
            typeof parsed.zoom === 'number'
          ) {
            saved = parsed;
          }
        } catch {
          /* posició malformada: ignorem */
        }
      }
    }

    restoring.current = true;
    const apply = () => {
      try {
        if (saved) {
          map.setView([saved.lat, saved.lon], saved.zoom, { animate: false });
        } else if (activeAdf?.bbox) {
          const b = activeAdf.bbox;
          map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { animate: false });
        } else if (activeAdf?.center) {
          map.setView(activeAdf.center, 14, { animate: false });
        } else {
          map.setView([41.56, 1.72], 11, { animate: false });
        }
      } catch {
        /* guard de seguretat: qualsevol error no trenca el mapa */
      }
      setTimeout(() => { restoring.current = false; }, 350);
    };

    // whenReady crida la cb immediatament si el mapa ja està carregat.
    map.whenReady(apply);
  }, [map, activeAdf?.id, activeAdf]);

  useEffect(() => {
    if (!map) {return;}
    const save = () => {
      if (restoring.current) {return;}
      const adfId = activeAdf?.id;
      if (adfId === undefined) {return;}
      const c = map.getCenter();
      localStorage.setItem(
        MAP_POS_KEY,
        JSON.stringify({ adfId, lat: c.lat, lon: c.lng, zoom: map.getZoom() })
      );
    };
    map.on('moveend', save);
    map.on('zoomend', save);
    return () => {
      map.off('moveend', save);
      map.off('zoomend', save);
    };
  }, [map, activeAdf?.id]);

  return null;
}