import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdf } from "../../../contexts/AdfContext";
import type { Position } from "../../../hooks/usePositionPolling";
import { timeAgo } from "../../../utils/time";
import { primaryButtonClass, secondaryButtonClass } from "../../../styles/uiStyles";
import { toast } from "react-toastify";

const CONNECTED_MS = 15 * 60 * 1000;

export function SeguimentTab({ positions }: { positions: Record<string, Position> }) {
  const { user } = useAuth();
  const { activeAdf, setActiveAdf } = useAdf();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(!!user?.mqtt_enabled);
  const [now, setNow] = useState(() => Date.now());
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const perms = user?.permissions ?? [];
  const canToggle =
    !!activeAdf &&
    perms.includes("manage_own_adf_sharing") &&
    (user?.role === "admin" || activeAdf?.id === user?.adf_id);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflecteix l'estat de compartició de l'ADF activa
    setShared(!!activeAdf?.tracking_shared);
  }, [activeAdf?.id, activeAdf?.tracking_shared]);

  async function toggleShare(checked: boolean) {
    if (!activeAdf) {
      return;
    }
    setShared(checked);
    setSaving(true);
    try {
      const r = await fetch(`/api/adfs/${activeAdf.id}/tracking-sharing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ shared: checked }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.error || `API ${r.status}`);
      }
      setActiveAdf({ ...activeAdf, tracking_shared: checked });
      toast.success(checked ? "Tracking compartit amb totes les ADFs" : "Tracking privat de l'ADF");
    } catch (err) {
      setShared(!checked);
      toast.error(err instanceof Error ? err.message : "Error actualitzant el tracking");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/tracking/status", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          setAvailable(data.available);
          setEnabled(data.enabled);
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const t = setInterval(() => {
      void poll();
    }, 300000);
    return () => clearInterval(t);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tracking/enable", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error activant OwnTracks");
        return;
      }
      setEnabled(true);
    } catch {
      toast.error("Error de connexió");
    } finally {
      setLoading(false);
    }
  };

  const handleConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tracking/config", { credentials: "same-origin" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error descarregant config");
        return;
      }
      const otrc = (await res.json()) as Record<string, unknown>;
      downloadOtrc(otrc);
    } catch {
      toast.error("Error de connexió");
    } finally {
      setLoading(false);
    }
  };

  const downloadOtrc = (config: Record<string, unknown>) => {
    if (!user) {
      return;
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.username.replace(/\//g, "_")}.otrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const connected = useMemo(() => {
    return Object.entries(positions)
      .map(([username, pos]) => ({ username, ts: pos.receivedAt || pos.timestamp }))
      .filter((p) => now - p.ts < CONNECTED_MS)
      .sort((a, b) => b.ts - a.ts);
  }, [positions, now]);

  const handleCenterOnUser = (username: string) => {
    const pos = positions[username];
    if (!pos) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent("map-center-node", {
        detail: { geometry: { coordinates: [pos.lon, pos.lat] } },
      }),
    );
  };

  if (!user) {
    return (
      <div className="p-4 text-[0.85rem] text-muted">
        Inicia sessió a la pestanya <strong>Usuaris</strong> per activar el seguiment.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="m-0 text-[0.95rem] font-semibold">Seguiment OwnTracks</h3>
        <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
          <span
            className={`w-2 h-2 rounded-full ${available ? "bg-[#22c55e]" : "bg-[#ef4444]"}`}
            title={available ? "disponible" : "no disponible"}
          />
          {available ? "disponible" : "no disponible"}
        </span>
      </div>
      {!enabled ? (
        <ol className="m-0 p-0 list-none space-y-3 text-[0.85rem] leading-relaxed">
          <li>
            <h4 className="m-0 mb-1 text-[0.85rem] font-semibold">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] mr-1 rounded-full bg-primary text-white text-[0.7rem] align-middle">
                1
              </span>
              Instal·la l'app OwnTracks
            </h4>
            <p className="m-0 mb-2 text-[0.8rem] text-muted">
              Tria la tenda segons la teva plataforma:
            </p>
            <div className="flex gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=org.owntracks.android"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-[2px] border border-border rounded-xl p-2 no-underline text-center hover:bg-soft"
              >
                <span className="text-[1.3rem]">📱</span>
                <span className="text-[0.8rem] font-semibold text-ink">Android</span>
                <span className="text-[0.7rem] text-muted">Google Play</span>
              </a>
              <a
                href="https://apps.apple.com/app/owntracks/id692424691"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-[2px] border border-border rounded-xl p-2 no-underline text-center hover:bg-soft"
              >
                <span className="text-[1.3rem]">🍏</span>
                <span className="text-[0.8rem] font-semibold text-ink">iPhone</span>
                <span className="text-[0.7rem] text-muted">App Store</span>
              </a>
            </div>
            <p className="text-[0.75rem] text-muted mt-1 mb-0">
              Per que l'app funcioni bé, concedeix els permissos de localització precissa a
              OwnTracks i desactiva l'optimització de bateria per evitar que s'aturi sola.
            </p>
          </li>
          <li>
            <h4 className="m-0 mb-1 text-[0.85rem] font-semibold">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] mr-1 rounded-full bg-primary text-white text-[0.7rem] align-middle">
                2
              </span>
              Activa el seguiment
            </h4>
            <p className="m-0 mb-2 text-[0.8rem] text-muted">
              Genera les teves credencials personals i habilita la recepció de posicions:
            </p>
            <button
              onClick={() => {
                void handleEnable();
              }}
              disabled={loading}
              className={`${primaryButtonClass} w-full`}
              title="Activa OwnTracks i genera credencials"
            >
              {loading ? "⏳" : "🛡️ Activar"}
            </button>
          </li>
          <li>
            <h4 className="m-0 mb-1 text-[0.85rem] font-semibold">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] mr-1 rounded-full bg-primary text-white text-[0.7rem] align-middle">
                3
              </span>
              Importa les credencials
            </h4>
            <p className="m-0 text-[0.8rem] text-muted">
              Un cop activat apareixerà el botó <strong>📥 Baixar credencials</strong>: baixa el
              fitxer <strong>.otrc</strong> i obra'l amb OwnTracks. El fitxer conté les teves
              credencials: <strong>no el comparteixis amb ningú</strong>.
            </p>
          </li>
          <li>
            <h4 className="m-0 mb-1 text-[0.85rem] font-semibold">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] mr-1 rounded-full bg-primary text-white text-[0.7rem] align-middle">
                4
              </span>
              Comparteix la teva posició
            </h4>
            <p className="m-0 text-[0.8rem] text-muted">
              Per aparèixer al mapa, obre OwnTracks i deixa-la oberta (pot funcionar en segon pla,
              amb la pantalla bloquejada). Quan la tanquis ("Sortir" al menú), deixaràs de compartir
              la teva posició.
            </p>
          </li>
        </ol>
      ) : (
        <div>
          <button
            onClick={() => {
              void handleConfig();
            }}
            disabled={loading}
            className={`${secondaryButtonClass} w-full`}
            title="Descarrega el fitxer de configuració OwnTracks"
          >
            {loading ? "⏳" : "📥 Baixar credencials"}
          </button>
          <p className="text-muted text-[0.8rem] mt-2 mb-0">
            Ja tens el seguiment activat. Pots tornar a baixar les credencials d'OwnTracks sempre
            que vulguis. Per compartir la posició, obra OwnTracks; quan la tanquis, deixa de
            compartir.
          </p>
        </div>
      )}

      {canToggle && (
        <div className="mt-4 border border-border rounded p-3">
          <h4 className="m-0 mb-1 text-[0.85rem] font-semibold">
            Compartir tracking ({activeAdf?.nom})
          </h4>
          <label className="flex items-center gap-2 text-[0.85rem] cursor-pointer">
            <input
              type="checkbox"
              checked={shared}
              disabled={saving}
              onChange={(e) => {
                void toggleShare(e.target.checked);
              }}
            />
            Permetre que altres ADFs vegin les posicions OwnTracks d'aquesta ADF
          </label>
        </div>
      )}

      <h3 className="mt-5 mb-1 text-[0.95rem] font-semibold">
        Usuaris connectats ({connected.length})
      </h3>
      {connected.length === 0 ? (
        <p className="text-muted text-[0.85rem]">Cap usuari actiu ara mateix.</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {connected.map((p) => (
            <li
              key={p.username}
              onClick={() => handleCenterOnUser(p.username)}
              className="flex justify-between items-center px-3 py-[10px] border-b border-soft cursor-pointer hover:bg-soft"
              title="Centra el mapa en aquesta posició"
            >
              <span className="text-[0.9rem] font-medium text-ink">{p.username}</span>
              <span className="text-[0.8rem] text-muted">{timeAgo(p.ts)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
