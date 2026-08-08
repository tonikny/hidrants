// Hook tipat per persistir estat a localStorage: inicialitza des de l'storage
// i escriu a cada canvi. Únic punt de lectura/escriptura de dades serialitzades.
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage sense espai / indisponible: ignorem */
    }
  }, [key, value]);

  return [value, setValue];
}