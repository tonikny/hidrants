import type { IncidenciaFeature } from "../../types";
import {
  emojiPrioritatIncidencia,
  emojiTipusIncidencia,
  PRIORITATS_INCIDENCIA,
  labelDeCategoria,
} from "../../utils/incidenciaConstants";

export function IncidenciaList({
  features,
  onSelectIncidencia,
}: {
  features: IncidenciaFeature[];
  onSelectIncidencia?: (feature: IncidenciaFeature) => void;
}) {
  if (features.length === 0) {
    return <p className="text-muted text-[0.85rem]">No hi ha incidències obertes.</p>;
  }

  return (
    <div className="max-h-[35vh] overflow-y-auto border border-soft rounded">
      {features.map((f) => {
        const p = f.properties;
        return (
          <div
            key={f.id}
            onClick={() => onSelectIncidencia?.(f)}
            className="flex items-center gap-3 px-3 py-2.5 border-b border-soft cursor-pointer transition-colors duration-100 hover:bg-[#f5f5f5]"
          >
            <span className="text-[1.1rem]">{emojiTipusIncidencia(p.tipus)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[0.95rem] whitespace-nowrap overflow-hidden text-ellipsis text-ink">
                {p.titol}
              </div>
              <div className="text-xs text-muted flex flex-wrap gap-1 mt-0.5">
                <span
                  className={`font-medium ${
                    p.estat === "OBERT"
                      ? "text-[#d32f2f]"
                      : p.estat === "RESOLT" || p.estat === "TANCAT"
                        ? "text-[#2e7d32]"
                        : "text-[#ed6c02]"
                  }`}
                >
                  {p.estat}
                </span>
                <span>•</span>
                <span>
                  {emojiPrioritatIncidencia(p.prioritat)}{" "}
                  {labelDeCategoria(PRIORITATS_INCIDENCIA, p.prioritat)}
                </span>
                <span>•</span>
                <span>{new Date(p.actualitzat_at).toLocaleString("ca-ES")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
