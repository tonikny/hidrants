// Hook que polla GET /api/tracking/positions cada intervalMs i retorna les posicions.
import { useState, useEffect, useRef } from 'react';

export interface Position {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  battery: number;
  receivedAt: number;
}

/** Hook reutilizable per obtenir posicions OwnTracks amb polling automàtic. */
export function usePositionPolling(intervalMs = 15000): Record<string, Position> {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/tracking/positions?_=${Date.now()}`, { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          setPositions(data.positions || {});
        }
      } catch { /* ignore */ }
    };
    void poll();
    intervalRef.current = setInterval(() => { void poll(); }, intervalMs);
    return () => { if (intervalRef.current) {clearInterval(intervalRef.current);} };
  }, [intervalMs]);

  return positions;
}