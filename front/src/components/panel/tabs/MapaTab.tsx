import { useAuth } from "../../../contexts/AuthContext";
import { useAdf } from "../../../contexts/AdfContext";
import { OsmSyncPanel } from "../../osm/OsmSyncPanel";
import { adfLabel } from "../../../utils/adfLabel";

export function MapaTab() {
  const { adfs, isLoading, activeAdf, setActiveAdf } = useAdf();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="text-center p-8 text-muted text-[0.85rem]">Carregant ADFs...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="m-0 mb-1 text-[0.95rem] font-semibold">Escull àmbit territorial</h3>
      <div className="border border-border rounded overflow-hidden mt-2">
        {adfs.map((adf) => (
          <button
            key={adf.id}
            onClick={() => setActiveAdf(adf)}
            className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b border-soft last:border-b-0 cursor-pointer text-[0.9rem] transition-colors ${
              activeAdf?.id === adf.id ? "bg-[#e3f2fd] text-ink font-semibold" : "bg-white text-ink"
            }`}
          >
            <span className={activeAdf?.id === adf.id ? "text-primary" : "text-muted"}>-</span>
            <span>{adfLabel(adf.id, adf.nom)}</span>
            {user?.adf_id === adf.id && (
              <span className="ml-auto text-muted" title="La teva ADF">
                👤
              </span>
            )}
          </button>
        ))}
      </div>

      {(user?.permissions ?? []).includes("sync_osm") && (
        <div className="mt-4">
          <OsmSyncPanel />
        </div>
      )}
    </div>
  );
}
