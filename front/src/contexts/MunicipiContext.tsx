import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MunicipiData {
  name: string;
  slug: string;
  osmRelation: string;
  bbox: [number, number, number, number]; // [minlat, minlon, maxlat, maxlon]
  center: [number, number]; // [lat, lon]
}

interface MunicipiContextType {
  municipi: MunicipiData | null;
  isLoading: boolean;
  error: string | null;
}

const MunicipiContext = createContext<MunicipiContextType | undefined>(undefined);

export const MunicipiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [municipi, setMunicipi] = useState<MunicipiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMunicipi = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/municipi');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMunicipi(data);
      } catch (err) {
        console.error('Error fetching municipi data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMunicipi();
  }, []);

  useEffect(() => {
    if (municipi) {
      document.title = `Hidrants - ${municipi.name}`;
    } else {
      document.title = 'Mapa d\'hidrants';
    }
  }, [municipi]);

  return (
    <MunicipiContext.Provider value={{ municipi, isLoading, error }}>
      {children}
    </MunicipiContext.Provider>
  );
};

export const useMunicipi = () => {
  const context = useContext(MunicipiContext);
  if (context === undefined) {
    throw new Error('useMunicipi must be used within a MunicipiProvider');
  }
  return context;
};
