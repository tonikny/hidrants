import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface AdfData {
  id: number;
  nom: string;
  osm_relations: string[];
  bbox: [number, number, number, number] | null;
  center: [number, number] | null;
  boundary_geojson?: any;
}

interface AdfContextType {
  activeAdf: AdfData | null;
  setActiveAdf: (adf: AdfData | null) => void;
  adfs: AdfData[];
  isLoading: boolean;
  error: string | null;
  boundaryGeojson: string | null;
}

const AdfContext = createContext<AdfContextType | undefined>(undefined);

export const AdfProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeAdf, setActiveAdfState] = useState<AdfData | null>(null);
  const [adfs, setAdfs] = useState<AdfData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState<string | null>(null);

  const setActiveAdf = useCallback((adf: AdfData | null) => {
    setActiveAdfState(adf);
    const url = new URL(window.location.href);
    if (adf) {
      localStorage.setItem('active_adf_id', adf.id.toString());
      document.title = `Hidrants - ${adf.nom}`;
      url.searchParams.set('adf', adf.id.toString());
    } else {
      localStorage.removeItem('active_adf_id');
      document.title = 'Mapa d\'hidrants';
      url.searchParams.delete('adf');
      url.searchParams.delete('node');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Carregar llista d'ADFs inicial
  useEffect(() => {
    const fetchAdfs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/adfs'); 
        if (!response.ok) throw new Error('Error carregant ADFs');
        const data = await response.json();
        setAdfs(data);
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlAdfId = urlParams.get('adf');

        // Prioritat 0: Paràmetre ADF a la URL
        if (urlAdfId) {
          const urlAdf = data.find((a: AdfData) => a.id === Number(urlAdfId));
          if (urlAdf) {
            setActiveAdf(urlAdf);
            return;
          }
        }

        // Prioritat 1: Recuperar de localStorage (el que l'usuari estava veient realment)
        const savedAdfId = localStorage.getItem('active_adf_id');
        if (savedAdfId) {
          const savedAdf = data.find((a: AdfData) => a.id === Number(savedAdfId));
          if (savedAdf) {
            setActiveAdf(savedAdf);
            return;
          }
        }

        // Prioritat 2: ADF de l'usuari si és editor (només si no hi ha res guardat)
        if (user && user.role === 'editor' && user.adf_id) {
          const userAdf = data.find((a: AdfData) => a.id === user.adf_id);
          if (userAdf) {
            setActiveAdf(userAdf);
            return;
          }
        }

        // Si teníem un adf a la URL però no era vàlid, el netegem
        if (urlAdfId) {
          setActiveAdf(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdfs();
  }, [user, setActiveAdf]); 

  useEffect(() => {
    if (!activeAdf) { setBoundaryGeojson(null); return; }
    fetch(`/api/adf/boundary?adf=${activeAdf.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(gj => setBoundaryGeojson(gj ? JSON.stringify(gj) : null))
      .catch(() => setBoundaryGeojson(null));
  }, [activeAdf?.id]);

  const value = useMemo(() => ({ activeAdf, setActiveAdf, adfs, isLoading, error, boundaryGeojson }), [activeAdf, setActiveAdf, adfs, isLoading, error, boundaryGeojson]);

  return <AdfContext.Provider value={value}>{children}</AdfContext.Provider>;
};

export const useAdf = () => {
  const context = useContext(AdfContext);
  if (context === undefined) throw new Error('useAdf must be used within an AdfProvider');
  return context;
};
