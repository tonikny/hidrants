import { useMemo, useState } from "react";
import type { HidrantFeature } from "../../hooks/useHidrantData";
import { getHydrantStatus, getHydrantIconUrl } from "../../utils/icons";
import { inputClass } from "../../styles/uiStyles";

export function HydrantList({
  features,
  onSelectNode,
}: {
  features: HidrantFeature[];
  onSelectNode?: (feature: HidrantFeature) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) {
      return features;
    }
    const s = search.toLowerCase();
    return features.filter((f) => {
      const ui = f.properties.ui_fields || {};
      const address = `${ui.street || ""} ${ui.num || ""} ${ui.barri || ""}`.toLowerCase();
      return address.includes(s);
    });
  }, [features, search]);

  return (
    <div>
      <input
        type="text"
        placeholder="Cerca per carrer/barri..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputClass} mb-2 p-2! box-border`}
      />
      <div className="max-h-[35vh] overflow-y-auto border border-soft rounded">
        {filtered.length === 0 ? (
          <p className="text-center text-muted p-4 text-[0.85rem]">No s'han trobat hidrants.</p>
        ) : (
          filtered.map((f) => {
            const ui = f.properties.ui_fields || {};
            const address = `${ui.street || ""} ${ui.num || ""}`.trim();
            const neighborhood = ui.barri ? `(${ui.barri})` : "";
            const diameters = ui.diameters ? ui.diameters.split(";").join(", ") + " mm" : "";
            const isOutOfService = ui.estat === "Fora de servei";
            return (
              <div
                key={f.id}
                onClick={() => onSelectNode?.(f)}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-soft cursor-pointer transition-colors duration-100 hover:bg-[#f5f5f5]"
              >
                <img
                  src={getHydrantIconUrl(getHydrantStatus(ui))}
                  alt="Estat"
                  className="w-4 h-6.5 object-contain shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[0.95rem] whitespace-nowrap overflow-hidden text-ellipsis text-ink"
                    title={`${address} ${neighborhood}`}
                  >
                    {address || "Sense adreça"}{" "}
                    <span className="font-normal text-muted text-[0.85rem]">{neighborhood}</span>
                  </div>
                  <div className="text-xs text-muted flex flex-wrap gap-1 mt-0.5">
                    <span
                      className={`font-medium ${isOutOfService ? "text-[#d32f2f]" : "text-[#2e7d32]"}`}
                    >
                      {ui.estat || "Desconegut"}
                    </span>
                    <span>•</span>
                    <span>{ui.surveyDate || "No revisat"}</span>
                    {diameters && (
                      <>
                        <span>•</span>
                        <span>{diameters}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
