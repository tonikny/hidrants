import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { toast } from 'react-toastify';
import { useAdf } from '../../contexts/AdfContext';
import { getQueryParam, setNodeUrlParam } from '../../utils/urlParams';
import type { IncidenciaFeature } from '../../types';
import type { HidrantFeature } from '../../hooks/useHidrantData';

interface MapUrlHandlerProps {
  features: HidrantFeature[];
  incidenciaFeatures: IncidenciaFeature[];
  loadingHidrants: boolean;
  loadingIncidencies: boolean;
  onSelectNode: (feature: HidrantFeature) => void;
  onSelectIncidencia: (feature: IncidenciaFeature) => void;
}

/**
 * Gestiona l'obertura programàtica de nodes des de la URL (?node=ID)
 * Accepta tant hidrants com incidències. Si el node no existeix,
 * mostra un avís i neteja la URL.
 */
export function MapUrlHandler({
  features,
  incidenciaFeatures,
  loadingHidrants,
  loadingIncidencies,
  onSelectNode,
  onSelectIncidencia,
}: MapUrlHandlerProps) {
  const map = useMap();
  const { activeAdf } = useAdf();
  const lastNodeId = useRef<string | null>(null);
  const fittedAdfId = useRef<number | null>(null);

  const checkUrl = () => {
    const nodeId = getQueryParam('node');

    if (nodeId && nodeId !== lastNodeId.current) {
      const feature = features.find(f => f.id === nodeId);
      const incidencia = feature ? null : incidenciaFeatures.find(f => f.id === nodeId);

      if (feature || incidencia) {
        lastNodeId.current = nodeId;

        // La selecció obre el panell; el centratge amb correcció del
        // bottomsheet el fa MapNodeCenter en un sol moviment.
        map.whenReady(() => {
          if (map.getContainer().clientWidth > 0) {
            if (feature) {
              onSelectNode(feature);
            } else {
              onSelectIncidencia(incidencia!);
            }
          }
        });
        // Si encara estan carregant, esperem: l'effect tornarà a executar checkUrl
      } else if (!loadingHidrants && !loadingIncidencies) {
        // Node no trobat i ja no carreguen les llistes: decidim definitivament
        toast.warn(`No s'ha trobat el node: ${nodeId}`);
        lastNodeId.current = nodeId;

        // Netegem el paràmetre de la URL
        setNodeUrlParam(null);

        // Forcem el fitBounds de l'ADF com si no haguéssim tingut node
        if (activeAdf && fittedAdfId.current !== activeAdf.id) {
          map.whenReady(() => {
            if (map.getContainer().clientWidth > 0) {
              if (activeAdf.bbox) {
                const bbox = activeAdf.bbox;
                map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]);
              } else if (activeAdf.center) {
                map.setView(activeAdf.center, 14);
              }
              fittedAdfId.current = activeAdf.id;
            }
          });
        }
      }
      // Si encara estan carregant, esperem: l'effect tornarà a executar checkUrl
    }
  };

  useEffect(() => {
    checkUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, incidenciaFeatures, loadingHidrants, loadingIncidencies, map, activeAdf, onSelectNode, onSelectIncidencia]);

  return null;
}
