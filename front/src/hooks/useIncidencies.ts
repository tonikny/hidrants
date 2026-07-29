import { useState, useEffect, useCallback } from 'react';
import { useAdf } from '../contexts/AdfContext';
import { IncidentFeature, Incident, IncidentEvent } from '../types';

export function useIncidencies() {
  const { activeAdf } = useAdf();
  const [features, setFeatures] = useState<IncidentFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidencies = useCallback(async () => {
    if (!activeAdf) {
      setFeatures([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/incidencies?adf=${activeAdf.id}`);
      if (!response.ok) throw new Error('Error al carregar incidències');
      const data = await response.json();
      setFeatures(data.features || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }, [activeAdf?.id]);

  useEffect(() => {
    fetchIncidencies();
  }, [fetchIncidencies]);

  const getIncident = async (id: string): Promise<Incident & { events: IncidentEvent[] }> => {
    const response = await fetch(`/api/incidencies/${id}`);
    if (!response.ok) throw new Error('Error al carregar el detall de la incidència');
    return response.json();
  };

  const createIncident = async (data: any) => {
    const response = await fetch('/api/incidencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, adf_id: activeAdf?.id })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al crear la incidència');
    }
    const result = await response.json();
    fetchIncidencies(); // Recarregar llista
    return result;
  };

  const addEvent = async (incidenciaId: string, tipusEvent: string, dades: any) => {
    const response = await fetch(`/api/incidencies/${incidenciaId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipus_event: tipusEvent, dades })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al afegir l\'esdeveniment');
    }
    const result = await response.json();
    fetchIncidencies(); // Recarregar llista per actualitzar estat denormalitzat
    return result;
  };

  return { 
    features, 
    loading, 
    error, 
    refresh: fetchIncidencies,
    getIncident,
    createIncident,
    addEvent
  };
}
