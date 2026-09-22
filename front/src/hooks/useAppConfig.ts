import { useEffect, useState } from "react";

// Es demana una sola vegada per sessió i només es cacheja si la resposta és vàlida
// (si falla, el següent muntatge ho tornarà a intentar).
let cachedMaxHydrantMoveMeters: number | null = null;

/**
 * Configuració pública del backend (GET /api/config). El límit de moviment d'un hidrant es defineix
 * només al backend; mentre no s'hagi carregat (o si falla) és `null` i no es permet arrossegar.
 */
export function useAppConfig() {
  const [maxHydrantMoveMeters, setMaxHydrantMoveMeters] = useState<number | null>(
    cachedMaxHydrantMoveMeters,
  );

  useEffect(() => {
    if (cachedMaxHydrantMoveMeters !== null) {
      return;
    }
    let cancelled = false;
    void fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const value = data?.max_hydrant_move_meters;
        if (typeof value === "number" && value > 0) {
          cachedMaxHydrantMoveMeters = value;
          if (!cancelled) {
            setMaxHydrantMoveMeters(value);
          }
        }
      })
      .catch(() => {
        /* sense configuració: no es permet arrossegar */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { maxHydrantMoveMeters };
}
