import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdf } from "../../../contexts/AdfContext";
import type { Position } from "../../../hooks/usePositionPolling";
import { timeAgo } from "../../../utils/time";
import { Modal } from "../../shared/Modal";
import { primaryButtonClass, secondaryButtonClass } from "../../../styles/uiStyles";
import { toast } from "react-toastify";

const CONNECTED_MS = 15 * 60 * 1000;

export function SeguimentTab({ positions }: { positions: Record<string, Position> }) {
  const { user } = useAuth();
  const { activeAdf, setActiveAdf } = useAdf();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(!!user?.mqtt_enabled);
  const [otrc, setOtrc] = useState<Record<string, unknown> | null>(null);
  const [showModal, setShowModal] = useState(false);
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
      setOtrc(await res.json());
      setEnabled(true);
      setShowModal(true);
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
      setOtrc(await res.json());
      setShowModal(true);
    } catch {
      toast.error("Error de connexió");
    } finally {
      setLoading(false);
    }
  };

  const downloadCurrent = () => {
    if (!otrc || !user) {
      return;
    }
    const blob = new Blob([JSON.stringify(otrc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.username}.otrc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowModal(false);
  };

  const connected = useMemo(() => {
    return Object.entries(positions)
      .map(([username, pos]) => ({ username, ts: pos.receivedAt || pos.timestamp }))
      .filter((p) => now - p.ts < CONNECTED_MS)
      .sort((a, b) => b.ts - a.ts);
  }, [positions, now]);

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
            que vulguis.
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
              className="flex justify-between items-center px-3 py-[10px] border-b border-soft"
            >
              <span className="text-[0.9rem] font-medium text-ink">{p.username}</span>
              <span className="text-[0.8rem] text-muted">{timeAgo(p.ts)}</span>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <Modal title="OwnTracks" onClose={() => setShowModal(false)}>
          <div className="text-[0.9rem] leading-normal">
            <p className="mt-0">Per activar el seguiment de posicions:</p>
            <ol className="pl-[1.2rem] my-2">
              <li>
                Instal·la <strong>OwnTracks</strong> al teu mòbil:
                <div className="mt-[4px] flex gap-2">
                  <a
                    href="https://play.google.com/store/apps/details?id=org.owntracks.android"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.8rem] text-primary"
                  >
                    📱 Android
                  </a>
                  <a
                    href="https://apps.apple.com/app/owntracks/id692424691"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.8rem] text-primary"
                  >
                    🍏 iOS
                  </a>
                </div>
              </li>
              <li className="mt-2">Descarrega el fitxer de configuració</li>
              <li>Obre'l amb OwnTracks per importar-lo</li>
            </ol>
            <p className="text-muted text-[0.8rem] my-2">
              El fitxer conté les credencials del teu usuari. No el comparteixis.
            </p>
            <button
              onClick={downloadCurrent}
              className="w-full p-[10px] bg-primary text-white border-0 rounded text-[0.9rem] cursor-pointer mt-2"
            >
              📥 Baixar {user.username}.otrc
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
