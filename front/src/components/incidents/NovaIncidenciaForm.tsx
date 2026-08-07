import React, { useState } from "react";
import { useIncidencies } from "../../hooks/useIncidencies";
import { toast } from "react-toastify";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from "../../styles/uiStyles";
import { CoordinatesLabel } from "../shared/CoordinatesLabel";
import { logError } from "../../utils/log";

interface NovaIncidenciaFormProps {
  lat: number;
  lon: number;
  onClose: () => void;
}

export const NovaIncidenciaForm = ({ lat, lon, onClose }: NovaIncidenciaFormProps) => {
  const { createIncidencia } = useIncidencies();
  const [type, setType] = useState("FOC");
  const [priority, setPriority] = useState("MITJANA");
  const [visibilitat, setVisibilitat] = useState("ADF_PRIVADA");
  const [titol, setTitol] = useState("");
  const [comentari, setComentari] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createIncidencia({
        titol,
        tipus: type,
        prioritat: priority,
        visibilitat,
        lat,
        lon,
        comentari,
      });
      toast.success("Incidència reportada amb èxit!");
      onClose();
    } catch (err) {
      logError("Error enviant incidència", err);
      toast.error("Error enviant la incidència");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="flex flex-col px-2"
    >
      <CoordinatesLabel lat={lat} lon={lon} />

      {/* Títol */}
      <label className="text-[0.8rem] italic mb-2">
        Títol de la incidència:
        <input
          type="text"
          value={titol}
          onChange={(e) => setTitol(e.target.value)}
          placeholder="Ex: Fum a prop de Can Gall"
          className={inputClass}
          required
        />
      </label>

      {/* Tipus d'Incidència */}
      <label className="text-[0.8rem] italic mb-2">
        Tipus d'incidència:
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={selectClass}
          required
        >
          <option value="FOC">🔥 Foc de vegetació / forestal</option>
          <option value="FUM">💨 Columna de fum</option>
          <option value="ACCIDENT">🚗 Accident de trànsit</option>
          <option value="ALTRA">⚠️ Altres incidències / Anomalies</option>
        </select>
      </label>

      {/* Prioritat */}
      <label className="text-[0.8rem] italic mb-2">
        Prioritat:
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={selectClass}
          required
        >
          <option value="BAIXA">🟢 Baixa (No urgent)</option>
          <option value="MITJANA">🟡 Mitjana (Cal atenció)</option>
          <option value="ALTA">🔴 Alta (Urgent! Perillós)</option>
        </select>
      </label>

      {/* Visibilitat */}
      <label className="text-[0.8rem] italic mb-3">
        Visibilitat:
        <select
          value={visibilitat}
          onChange={(e) => setVisibilitat(e.target.value)}
          className={selectClass}
          required
        >
          <option value="ADF_PRIVADA">🔒 Només la pròpia ADF</option>
          <option value="TOTES_ADFS">👥 Totes les ADFs</option>
          <option value="PUBLICA">🌍 Pública</option>
        </select>
      </label>

      {/* Comentari inicial */}
      <label className="text-[0.8rem] italic mb-3">
        Observacions inicials:
        <textarea
          value={comentari}
          onChange={(e) => setComentari(e.target.value)}
          placeholder="Més detalls..."
          className={`${inputClass} font-inherit h-[60px] resize-y p-[4px_6px]!`}
        />
      </label>

      {/* Botons */}
      <div className="flex justify-between gap-2 mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${primaryButtonClass} bg-[#dc3545] flex-1 p-2 text-[0.8rem] disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? "Enviant..." : "Reportar Incidència"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={`${secondaryButtonClass} flex-1 p-2 text-[0.8rem]`}
        >
          Cancel·la
        </button>
      </div>
    </form>
  );
};
